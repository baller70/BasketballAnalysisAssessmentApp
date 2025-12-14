#!/usr/bin/env python3
"""
ShotStack API Integration for Basketball Shooting Analysis

This module provides helper functions to integrate ShotStack video editing API
with basketball shooting form analysis. It enables:
- Adding skeleton overlays to videos
- Adding text annotations for coaching feedback
- Creating split-screen comparisons
- Drawing angle measurements and form guides
- Generating analysis videos with visual enhancements

Author: Basketball Analysis System
Date: 2025-12-13
"""

import os
import json
import time
import requests
from typing import Dict, List, Optional, Tuple, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.shotstack')


class ShotStackClient:
    """Client for interacting with ShotStack API"""
    
    def __init__(self, environment: str = 'sandbox'):
        """
        Initialize ShotStack client
        
        Args:
            environment: 'sandbox' or 'production'
        """
        self.environment = environment
        
        if environment == 'sandbox':
            self.api_key = os.getenv('SHOTSTACK_SANDBOX_API_KEY')
            self.endpoint = os.getenv('SHOTSTACK_SANDBOX_ENDPOINT')
        else:
            self.api_key = os.getenv('SHOTSTACK_PRODUCTION_API_KEY')
            self.endpoint = os.getenv('SHOTSTACK_PRODUCTION_ENDPOINT')
        
        self.headers = {
            'x-api-key': self.api_key,
            'Content-Type': 'application/json'
        }
    
    def render_video(self, edit_config: Dict) -> Dict:
        """
        Submit a video render request
        
        Args:
            edit_config: JSON configuration for the video edit
            
        Returns:
            Response containing render ID and status
        """
        url = f"{self.endpoint}/render"
        response = requests.post(url, headers=self.headers, json=edit_config)
        response.raise_for_status()
        return response.json()
    
    def get_render_status(self, render_id: str) -> Dict:
        """
        Check the status of a render
        
        Args:
            render_id: ID of the render to check
            
        Returns:
            Status information including progress and output URL
        """
        url = f"{self.endpoint}/render/{render_id}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def wait_for_render(self, render_id: str, timeout: int = 300, poll_interval: int = 5) -> Dict:
        """
        Wait for a render to complete
        
        Args:
            render_id: ID of the render to wait for
            timeout: Maximum time to wait in seconds
            poll_interval: Time between status checks in seconds
            
        Returns:
            Final render status
        """
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            status = self.get_render_status(render_id)
            
            if status['response']['status'] in ['done', 'failed']:
                return status
            
            print(f"Render status: {status['response']['status']} - {status['response'].get('progress', 0)}%")
            time.sleep(poll_interval)
        
        raise TimeoutError(f"Render {render_id} did not complete within {timeout} seconds")


class BasketballVideoEditor:
    """High-level editor for basketball analysis videos"""
    
    def __init__(self, client: ShotStackClient):
        self.client = client
    
    def create_shooting_form_analysis(self,
                                     video_url: str,
                                     skeleton_overlay_url: Optional[str] = None,
                                     annotations: Optional[List[Dict]] = None,
                                     angles: Optional[List[Dict]] = None,
                                     duration: float = 5.0,
                                     output_format: str = 'mp4') -> Dict:
        """
        Create a shooting form analysis video with overlays and annotations
        
        Args:
            video_url: URL of the basketball shooting video
            skeleton_overlay_url: URL of skeleton overlay image/video
            annotations: List of text annotations with positions and timing
            angles: List of angle measurements to draw
            duration: Duration of the video in seconds
            output_format: Output format ('mp4' or 'gif')
            
        Returns:
            Render response with render ID
        """
        tracks = []
        
        # Track 1: Base video
        video_track = {
            "clips": [{
                "asset": {
                    "type": "video",
                    "src": video_url
                },
                "start": 0,
                "length": duration
            }]
        }
        tracks.append(video_track)
        
        # Track 2: Skeleton overlay (if provided)
        if skeleton_overlay_url:
            skeleton_track = {
                "clips": [{
                    "asset": {
                        "type": "image",
                        "src": skeleton_overlay_url
                    },
                    "start": 0,
                    "length": duration,
                    "opacity": 0.7,
                    "position": "center"
                }]
            }
            tracks.append(skeleton_track)
        
        # Track 3: Angle measurements (if provided)
        if angles:
            for angle in angles:
                angle_track = self._create_angle_overlay(
                    angle['name'],
                    angle['value'],
                    angle['position'],
                    angle.get('start', 0),
                    angle.get('length', duration)
                )
                tracks.append(angle_track)
        
        # Track 4: Text annotations (if provided)
        if annotations:
            for annotation in annotations:
                text_track = self._create_text_annotation(
                    annotation['text'],
                    annotation.get('position', 'bottom'),
                    annotation.get('start', 0),
                    annotation.get('length', 2),
                    annotation.get('color', '#ffffff'),
                    annotation.get('background', '#000000')
                )
                tracks.append(text_track)
        
        # Create edit configuration
        edit_config = {
            "timeline": {
                "background": "#000000",
                "tracks": tracks
            },
            "output": {
                "format": output_format,
                "fps": 30,
                "size": {
                    "width": 1920,
                    "height": 1080
                }
            }
        }
        
        return self.client.render_video(edit_config)
    
    def create_split_screen_comparison(self,
                                      video1_url: str,
                                      video2_url: str,
                                      title1: str = "Before",
                                      title2: str = "After",
                                      duration: float = 5.0) -> Dict:
        """
        Create a split-screen comparison video
        
        Args:
            video1_url: URL of first video (left side)
            video2_url: URL of second video (right side)
            title1: Title for first video
            title2: Title for second video
            duration: Duration of the video in seconds
            
        Returns:
            Render response with render ID
        """
        tracks = [
            # Left video
            {
                "clips": [{
                    "asset": {
                        "type": "video",
                        "src": video1_url
                    },
                    "start": 0,
                    "length": duration,
                    "position": "left",
                    "scale": 0.5,
                    "offset": {"x": -0.25, "y": 0}
                }]
            },
            # Right video
            {
                "clips": [{
                    "asset": {
                        "type": "video",
                        "src": video2_url
                    },
                    "start": 0,
                    "length": duration,
                    "position": "right",
                    "scale": 0.5,
                    "offset": {"x": 0.25, "y": 0}
                }]
            },
            # Divider line
            {
                "clips": [{
                    "asset": {
                        "type": "shape",
                        "shape": "line",
                        "line": {
                            "length": 1080,
                            "thickness": 4
                        },
                        "fill": {
                            "color": "#ffffff",
                            "opacity": 1
                        }
                    },
                    "start": 0,
                    "length": duration,
                    "position": "center"
                }]
            },
            # Title 1
            {
                "clips": [{
                    "asset": {
                        "type": "text",
                        "text": title1,
                        "font": {
                            "family": "Arial",
                            "size": 48,
                            "color": "#ffffff",
                            "weight": 700
                        },
                        "alignment": {
                            "horizontal": "center",
                            "vertical": "top"
                        },
                        "background": {
                            "color": "#000000",
                            "opacity": 0.7
                        }
                    },
                    "start": 0,
                    "length": duration,
                    "position": "top",
                    "offset": {"x": -0.25, "y": 0.05}
                }]
            },
            # Title 2
            {
                "clips": [{
                    "asset": {
                        "type": "text",
                        "text": title2,
                        "font": {
                            "family": "Arial",
                            "size": 48,
                            "color": "#ffffff",
                            "weight": 700
                        },
                        "alignment": {
                            "horizontal": "center",
                            "vertical": "top"
                        },
                        "background": {
                            "color": "#000000",
                            "opacity": 0.7
                        }
                    },
                    "start": 0,
                    "length": duration,
                    "position": "top",
                    "offset": {"x": 0.25, "y": 0.05}
                }]
            }
        ]
        
        edit_config = {
            "timeline": {
                "background": "#000000",
                "tracks": tracks
            },
            "output": {
                "format": "mp4",
                "fps": 30,
                "size": {
                    "width": 1920,
                    "height": 1080
                }
            }
        }
        
        return self.client.render_video(edit_config)
    
    def _create_angle_overlay(self, name: str, value: float, position: Dict,
                             start: float, length: float) -> Dict:
        """
        Create an angle measurement overlay
        
        Args:
            name: Name of the angle (e.g., "Elbow Angle")
            value: Angle value in degrees
            position: Position dict with x, y coordinates
            start: Start time in seconds
            length: Duration in seconds
            
        Returns:
            Track configuration for the angle overlay
        """
        return {
            "clips": [
                # Angle arc (using circle shape)
                {
                    "asset": {
                        "type": "shape",
                        "shape": "circle",
                        "circle": {
                            "radius": 30
                        },
                        "stroke": {
                            "color": "#00ff00",
                            "width": 3
                        },
                        "fill": {
                            "color": "#00ff00",
                            "opacity": 0.2
                        }
                    },
                    "start": start,
                    "length": length,
                    "position": "center",
                    "offset": position
                },
                # Angle text
                {
                    "asset": {
                        "type": "text",
                        "text": f"{name}: {value:.1f}°",
                        "font": {
                            "family": "Arial",
                            "size": 24,
                            "color": "#00ff00",
                            "weight": 700
                        },
                        "alignment": {
                            "horizontal": "center",
                            "vertical": "center"
                        },
                        "background": {
                            "color": "#000000",
                            "opacity": 0.8
                        }
                    },
                    "start": start,
                    "length": length,
                    "position": "center",
                    "offset": {"x": position['x'], "y": position['y'] + 0.08}
                }
            ]
        }
    
    def _create_text_annotation(self, text: str, position: str, start: float,
                               length: float, color: str, background: str) -> Dict:
        """
        Create a text annotation overlay
        
        Args:
            text: Text to display
            position: Position ('top', 'center', 'bottom')
            start: Start time in seconds
            length: Duration in seconds
            color: Text color
            background: Background color
            
        Returns:
            Track configuration for the text annotation
        """
        return {
            "clips": [{
                "asset": {
                    "type": "text",
                    "text": text,
                    "font": {
                        "family": "Arial",
                        "size": 36,
                        "color": color,
                        "weight": 600
                    },
                    "alignment": {
                        "horizontal": "center",
                        "vertical": "center"
                    },
                    "background": {
                        "color": background,
                        "opacity": 0.85
                    }
                },
                "start": start,
                "length": length,
                "position": position,
                "width": 800,
                "height": 100
            }]
        }


def create_basketball_analysis_video(video_path: str,
                                    skeleton_data: Dict,
                                    analysis_results: Dict,
                                    output_path: str,
                                    environment: str = 'sandbox') -> str:
    """
    Main function to create a complete basketball analysis video
    
    Args:
        video_path: Path to the original basketball video
        skeleton_data: Skeleton keypoint data from pose estimation
        analysis_results: Analysis results including angles, feedback, etc.
        output_path: Path to save the output video
        environment: 'sandbox' or 'production'
        
    Returns:
        URL of the rendered video
    """
    # Initialize client and editor
    client = ShotStackClient(environment=environment)
    editor = BasketballVideoEditor(client)
    
    # TODO: Upload video to ShotStack or use existing URL
    video_url = video_path  # Assume it's already a URL or needs to be uploaded
    
    # Extract annotations from analysis results
    annotations = []
    if 'feedback' in analysis_results:
        for i, feedback in enumerate(analysis_results['feedback']):
            annotations.append({
                'text': feedback,
                'start': i * 2,
                'length': 2,
                'position': 'bottom'
            })
    
    # Extract angle measurements
    angles = []
    if 'angles' in analysis_results:
        for angle_name, angle_data in analysis_results['angles'].items():
            angles.append({
                'name': angle_name,
                'value': angle_data['value'],
                'position': angle_data.get('position', {'x': 0, 'y': 0}),
                'start': 0,
                'length': 5
            })
    
    # Create the analysis video
    render_response = editor.create_shooting_form_analysis(
        video_url=video_url,
        annotations=annotations,
        angles=angles,
        duration=5.0
    )
    
    # Wait for render to complete
    render_id = render_response['response']['id']
    print(f"Render started: {render_id}")
    
    final_status = client.wait_for_render(render_id)
    
    if final_status['response']['status'] == 'done':
        output_url = final_status['response']['url']
        print(f"Render complete: {output_url}")
        return output_url
    else:
        raise Exception(f"Render failed: {final_status['response'].get('error', 'Unknown error')}")


if __name__ == "__main__":
    # Example usage
    print("ShotStack Basketball Analysis Integration")
    print("=========================================\n")
    
    # Initialize client
    client = ShotStackClient(environment='sandbox')
    print(f"✓ Initialized ShotStack client (sandbox mode)")
    
    # Example: Create a simple test video
    editor = BasketballVideoEditor(client)
    
    # Test with sample data
    test_annotations = [
        {'text': 'Good elbow alignment', 'start': 0, 'length': 2, 'position': 'bottom'},
        {'text': 'Follow through needs work', 'start': 2, 'length': 2, 'position': 'bottom'}
    ]
    
    test_angles = [
        {'name': 'Elbow', 'value': 90.5, 'position': {'x': 0.2, 'y': 0}, 'start': 0, 'length': 5}
    ]
    
    print("\nExample configuration created:")
    print(f"- Annotations: {len(test_annotations)}")
    print(f"- Angle measurements: {len(test_angles)}")
    print("\nReady to integrate with basketball analysis pipeline!")
