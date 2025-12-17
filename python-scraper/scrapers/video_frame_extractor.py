"""
Video Frame Extractor
Downloads YouTube videos and extracts key frames at shooting phases
"""

import os
import cv2
import tempfile
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from loguru import logger
import yt_dlp
from PIL import Image
from io import BytesIO
import requests
import re
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import REQUEST_HEADERS, SCRAPE_DELAY_SECONDS

# Local temp directory for videos
TEMP_VIDEO_DIR = Path(tempfile.gettempdir()) / "basketball_videos"
TEMP_VIDEO_DIR.mkdir(exist_ok=True)

# Frame extraction intervals (percentage of video duration)
# Represents typical shooting phases in a shooting form video
# Filenames will be: setup.jpg, dip.jpg, release.jpg, follow-through.jpg
SHOOTING_PHASE_INTERVALS = {
    "setup": 0.15,           # Initial stance/grip
    "dip": 0.30,             # Ball dip/gather
    "release": 0.55,         # Ball at release point
    "follow-through": 0.75,  # After release (hyphenated to match folder structure)
}

# Alternative intervals for different video types
QUICK_SHOT_INTERVALS = {
    "setup": 0.20,
    "release": 0.50,
    "follow-through": 0.80,
}


def search_youtube_videos(query: str, max_results: int = 5) -> List[Dict]:
    """
    Search YouTube for videos matching the query
    
    Returns list of video info dicts
    """
    logger.info(f"Searching YouTube for: {query}")
    
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': True,  # Don't download, just get info
        'default_search': 'ytsearch',
    }
    
    videos = []
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            result = ydl.extract_info(f"ytsearch{max_results}:{query}", download=False)
            
            if result and 'entries' in result:
                for entry in result['entries']:
                    if entry:
                        videos.append({
                            'id': entry.get('id'),
                            'title': entry.get('title'),
                            'url': entry.get('url') or f"https://www.youtube.com/watch?v={entry.get('id')}",
                            'duration': entry.get('duration'),
                            'thumbnail': entry.get('thumbnail'),
                        })
        
        logger.info(f"Found {len(videos)} videos")
        return videos
        
    except Exception as e:
        logger.error(f"YouTube search error: {e}")
        return []


def download_youtube_video(video_url: str, output_path: Optional[Path] = None) -> Optional[Path]:
    """
    Download a YouTube video to local storage
    
    Returns path to downloaded video or None if failed
    """
    if output_path is None:
        output_path = TEMP_VIDEO_DIR / "%(id)s.%(ext)s"
    
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'format': 'best[height<=720]',  # Max 720p to save bandwidth
        'outtmpl': str(output_path),
        'noplaylist': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=True)
            
            if info:
                # Get the actual downloaded file path
                video_id = info.get('id')
                ext = info.get('ext', 'mp4')
                actual_path = TEMP_VIDEO_DIR / f"{video_id}.{ext}"
                
                if actual_path.exists():
                    logger.info(f"Downloaded video: {actual_path}")
                    return actual_path
        
        return None
        
    except Exception as e:
        logger.error(f"Video download error: {e}")
        return None


def extract_video_frames(
    video_path: Path,
    output_folder: Path,
    intervals: Dict[str, float] = None,
    player_name: str = "player"
) -> List[Dict]:
    """
    Extract key frames from a video at specified intervals
    
    Args:
        video_path: Path to video file
        output_folder: Directory to save extracted frames
        intervals: Dict of phase_name -> percentage (0-1) of video duration
        player_name: Player name for filename prefix
        
    Returns:
        List of extracted frame info dicts
    """
    if intervals is None:
        intervals = SHOOTING_PHASE_INTERVALS
    
    output_folder.mkdir(parents=True, exist_ok=True)
    extracted_frames = []
    
    try:
        cap = cv2.VideoCapture(str(video_path))
        
        if not cap.isOpened():
            logger.error(f"Cannot open video: {video_path}")
            return []
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        duration = total_frames / fps if fps > 0 else 0
        
        logger.info(f"Video: {total_frames} frames, {fps} fps, {duration:.1f}s duration")
        
        for phase_name, interval in intervals.items():
            # Calculate frame number
            frame_num = int(total_frames * interval)
            
            # Seek to frame
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
            ret, frame = cap.read()
            
            if ret:
                # Filename is just the phase name: setup.jpg, dip.jpg, release.jpg, follow-through.jpg
                filename = f"{phase_name}.jpg"
                output_path = output_folder / filename
                
                # Save frame
                cv2.imwrite(str(output_path), frame)
                
                # Get frame dimensions
                height, width = frame.shape[:2]
                
                extracted_frames.append({
                    'local_path': str(output_path),
                    'filename': filename,
                    'phase': phase_name,
                    'interval': interval,
                    'frame_number': frame_num,
                    'timestamp': frame_num / fps if fps > 0 else 0,
                    'resolution': f"{width}x{height}",
                    'category': f"form_{get_angle_from_phase(phase_name)}",
                    'angle': get_angle_from_phase(phase_name),
                    'is_primary': phase_name == 'release',  # Release frame is primary
                })
                
                logger.info(f"Extracted {phase_name} frame: {filename}")
            else:
                logger.warning(f"Failed to extract {phase_name} frame")
        
        cap.release()
        logger.info(f"Extracted {len(extracted_frames)} frames from video")
        
        return extracted_frames
        
    except Exception as e:
        logger.error(f"Frame extraction error: {e}")
        return []


def get_angle_from_phase(phase: str) -> str:
    """
    Determine likely shooting angle based on phase
    (This is a heuristic - actual angle depends on video)
    """
    # Most shooting form videos are side angle
    return "side"


def download_and_extract_frames(
    player_name: str,
    max_videos: int = 3,
    frames_per_video: int = 5
) -> List[Dict]:
    """
    Search for shooting form videos, download, and extract frames
    
    Args:
        player_name: Player name to search for
        max_videos: Maximum number of videos to process
        frames_per_video: Number of frames to extract per video
        
    Returns:
        List of all extracted frame info dicts
    """
    logger.info(f"Starting frame extraction for: {player_name}")
    all_frames = []
    
    # Search for shooting form videos
    search_queries = [
        f"{player_name} shooting form slow motion",
        f"{player_name} jump shot breakdown",
        f"{player_name} shooting technique",
    ]
    
    videos_processed = 0
    
    for query in search_queries:
        if videos_processed >= max_videos:
            break
        
        videos = search_youtube_videos(query, max_results=2)
        
        for video in videos:
            if videos_processed >= max_videos:
                break
            
            # Skip if video is too long (likely not a form video)
            if video.get('duration') and video['duration'] > 600:  # > 10 minutes
                logger.info(f"Skipping long video: {video['title']}")
                continue
            
            # Download video
            video_path = download_youtube_video(video['url'])
            
            if video_path and video_path.exists():
                # Create output folder following the structure:
                # /professional-shooters/nba/stephen-curry/side-angle/
                safe_name = re.sub(r'[^\w\s-]', '', player_name).lower().replace(' ', '-')
                output_folder = Path("downloaded_images") / "professional-shooters" / "nba" / safe_name / "side-angle"
                
                # Extract frames
                frames = extract_video_frames(
                    video_path=video_path,
                    output_folder=output_folder,
                    player_name=player_name
                )
                
                # Add video source info
                for frame in frames:
                    frame['video_id'] = video.get('id')
                    frame['video_title'] = video.get('title')
                    frame['source'] = 'youtube_video'
                
                all_frames.extend(frames)
                videos_processed += 1
                
                # Clean up video file to save space
                try:
                    video_path.unlink()
                except:
                    pass
    
    logger.info(f"Total frames extracted for {player_name}: {len(all_frames)}")
    return all_frames


def extract_frames_at_custom_timestamps(
    video_path: Path,
    timestamps: List[float],
    output_folder: Path,
    player_name: str = "player"
) -> List[Dict]:
    """
    Extract frames at specific timestamps (in seconds)
    
    Useful when you know exact moments in a video
    """
    output_folder.mkdir(parents=True, exist_ok=True)
    extracted_frames = []
    
    try:
        cap = cv2.VideoCapture(str(video_path))
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        for i, timestamp in enumerate(timestamps):
            frame_num = int(timestamp * fps)
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
            ret, frame = cap.read()
            
            if ret:
                safe_name = re.sub(r'[^\w\s-]', '', player_name).lower().replace(' ', '-')
                filename = f"{safe_name}_t{timestamp:.1f}s_{i}.jpg"
                output_path = output_folder / filename
                
                cv2.imwrite(str(output_path), frame)
                
                height, width = frame.shape[:2]
                
                extracted_frames.append({
                    'local_path': str(output_path),
                    'timestamp': timestamp,
                    'frame_number': frame_num,
                    'resolution': f"{width}x{height}",
                    'angle': 'side',
                    'category': 'form_side',
                })
                
        cap.release()
        return extracted_frames
        
    except Exception as e:
        logger.error(f"Custom timestamp extraction error: {e}")
        return []


def get_video_thumbnail(video_url: str) -> Optional[bytes]:
    """
    Get the thumbnail image for a YouTube video
    """
    # Extract video ID
    video_id_match = re.search(r'(?:v=|/)([a-zA-Z0-9_-]{11})', video_url)
    
    if not video_id_match:
        return None
    
    video_id = video_id_match.group(1)
    
    # Try different thumbnail qualities
    thumbnail_urls = [
        f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
        f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
        f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg",
    ]
    
    for url in thumbnail_urls:
        try:
            response = requests.get(url, headers=REQUEST_HEADERS, timeout=10)
            if response.status_code == 200:
                return response.content
        except:
            continue
    
    return None


def cleanup_temp_videos():
    """
    Clean up temporary video files
    """
    try:
        for video_file in TEMP_VIDEO_DIR.glob("*"):
            video_file.unlink()
        logger.info("Cleaned up temporary videos")
    except Exception as e:
        logger.warning(f"Cleanup error: {e}")


if __name__ == "__main__":
    # Test frame extraction
    logger.add("video_extractor.log", rotation="10 MB")
    
    # Test with Stephen Curry
    frames = download_and_extract_frames(
        player_name="Stephen Curry",
        max_videos=1,
        frames_per_video=5
    )
    
    print(f"\nExtracted {len(frames)} frames:")
    for frame in frames:
        print(f"  - {frame['phase']}: {frame['local_path']}")
    
    # Cleanup
    cleanup_temp_videos()







