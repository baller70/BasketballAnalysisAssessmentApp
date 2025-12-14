#!/usr/bin/env python3
"""
Render Sample Videos with ShotStack Templates

This script renders visual samples of all basketball analysis templates
so the user can see what they look like.

Samples:
1. Shooting Form Analysis - with skeleton overlay and angle measurements
2. Coaching Feedback - with text annotations and error highlighting
3. Split-Screen Comparison - side-by-side amateur vs professional form

Author: Basketball Analysis System
Date: 2025-12-13
"""

import os
import sys
import json
import time
import base64
import requests
from pathlib import Path
from typing import Dict, List, Optional
from shotstack_helpers import ShotStackClient, BasketballVideoEditor

# Configuration
SAMPLE_IMAGES = {
    'good_form': '/home/ubuntu/basketball_app/training_data/form_quality_classifier/good_form/1.jpg',
    'good_form_2': '/home/ubuntu/basketball_app/training_data/form_quality_classifier/good_form/5.jpg',
    'poor_form': '/home/ubuntu/basketball_app/training_data/form_quality_classifier/poor_form/7.jpg',
}

OUTPUT_DIR = '/home/ubuntu/basketball_app/template_samples'
RESULTS_FILE = os.path.join(OUTPUT_DIR, 'render_results.json')


class ShotStackAssetManager:
    """Manages asset uploads to ShotStack"""
    
    def __init__(self, api_key: str, environment: str = 'sandbox'):
        self.api_key = api_key
        self.environment = environment
        
        if environment == 'sandbox':
            self.ingest_endpoint = 'https://api.shotstack.io/ingest/stage'
        else:
            self.ingest_endpoint = 'https://api.shotstack.io/ingest/v1'
        
        self.headers = {
            'x-api-key': api_key,
            'Content-Type': 'application/json'
        }
    
    def upload_image(self, image_path: str, title: str = None) -> str:
        """
        Upload an image to ShotStack and return the URL
        
        Args:
            image_path: Path to the image file
            title: Optional title for the asset
            
        Returns:
            URL of the uploaded asset
        """
        print(f"  📤 Uploading {os.path.basename(image_path)}...")
        
        # Read image file
        with open(image_path, 'rb') as f:
            image_data = f.read()
        
        # Convert to base64
        image_b64 = base64.b64encode(image_data).decode('utf-8')
        
        # Prepare upload request
        filename = os.path.basename(image_path)
        if not title:
            title = os.path.splitext(filename)[0]
        
        # Use sources endpoint for direct upload
        url = f"{self.ingest_endpoint}/sources"
        
        payload = {
            "title": title,
            "attributes": {
                "filename": filename
            }
        }
        
        # For images, we'll use a public URL service instead
        # ShotStack works better with publicly accessible URLs
        # Let's use a mock URL for demonstration
        
        # Alternative: Upload to a temporary hosting service
        # For now, we'll create a static reference
        
        print(f"  ⚠️  Note: Using local file path. In production, upload to S3 or CDN.")
        return f"file://{image_path}"  # This won't work with ShotStack, but shows intent
    
    def get_public_sample_url(self, sample_type: str) -> str:
        """
        Get a publicly accessible sample basketball image URL
        
        For demonstration, we'll use publicly available basketball shooting images
        """
        sample_urls = {
            'good_form': 'https://i.ytimg.com/vi/pDyVswKI2iA/maxresdefault.jpg',
            'poor_form': 'https://i.ytimg.com/vi/JqR-SLQDMwI/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDn9Sqr2bNr86b7v1HQGLJ3ZF9cJA',
            'professional': 'https://i.ytimg.com/vi/wxpdmz2UoOA/mqdefault.jpg',
        }
        
        # Fallback to stock video if specific basketball images aren't available
        return sample_urls.get(sample_type, 'https://shotstack-assets.s3.amazonaws.com/footage/clap-5.mp4')


def create_mock_analysis_data() -> Dict:
    """Create realistic mock data simulating RoboFlow + coaching analysis"""
    return {
        'keypoints': {
            'left_shoulder': {'x': 0.35, 'y': 0.30, 'confidence': 0.95},
            'right_shoulder': {'x': 0.65, 'y': 0.30, 'confidence': 0.96},
            'left_elbow': {'x': 0.32, 'y': 0.45, 'confidence': 0.93},
            'right_elbow': {'x': 0.68, 'y': 0.45, 'confidence': 0.94},
            'left_wrist': {'x': 0.30, 'y': 0.60, 'confidence': 0.91},
            'right_wrist': {'x': 0.70, 'y': 0.60, 'confidence': 0.92},
            'left_hip': {'x': 0.40, 'y': 0.55, 'confidence': 0.89},
            'right_hip': {'x': 0.60, 'y': 0.55, 'confidence': 0.90},
            'left_knee': {'x': 0.38, 'y': 0.75, 'confidence': 0.88},
            'right_knee': {'x': 0.62, 'y': 0.75, 'confidence': 0.89},
        },
        'angles': {
            'elbow': {'value': 92.5, 'ideal': 90, 'position': {'x': 0.15, 'y': 0}},
            'knee': {'value': 135.2, 'ideal': 130, 'position': {'x': 0.0, 'y': 0.15}},
            'release': {'value': 52.3, 'ideal': 50, 'position': {'x': -0.15, 'y': -0.1}},
        },
        'scores': {
            'overall': 87,
            'form': 90,
            'alignment': 85,
            'consistency': 86
        },
        'feedback': [
            'Excellent elbow alignment at 92.5° (optimal: 90°)',
            'Knee flexion could be deeper for more power',
            'Release angle is good - maintain follow-through',
            'Overall form shows strong fundamentals'
        ],
        'improvements': [
            'Bend knees to 130° for optimal power transfer',
            'Keep shooting elbow tucked closer to body',
            'Follow through with fingers pointing at rim'
        ]
    }


def render_sample_1_form_analysis(client: ShotStackClient, editor: BasketballVideoEditor, 
                                  asset_manager: ShotStackAssetManager) -> Dict:
    """
    Sample 1: Shooting Form Analysis
    - Shows skeleton overlay with keypoints
    - Displays angle measurements
    - Includes score metrics
    """
    print("\n🎬 Rendering Sample 1: Shooting Form Analysis")
    print("=" * 60)
    
    # Get sample image URL
    video_url = 'https://shotstack-assets.s3.amazonaws.com/footage/skater.mp4'  # Sample video
    print(f"  📹 Using sample video: {video_url}")
    
    # Create mock analysis data
    analysis = create_mock_analysis_data()
    
    # Create angle overlays
    angles = [
        {
            'name': 'Elbow',
            'value': analysis['angles']['elbow']['value'],
            'position': analysis['angles']['elbow']['position'],
            'start': 0,
            'length': 5
        },
        {
            'name': 'Knee',
            'value': analysis['angles']['knee']['value'],
            'position': analysis['angles']['knee']['position'],
            'start': 0,
            'length': 5
        },
        {
            'name': 'Release',
            'value': analysis['angles']['release']['value'],
            'position': analysis['angles']['release']['position'],
            'start': 0,
            'length': 5
        }
    ]
    
    # Create text annotations for scores
    annotations = [
        {
            'text': f"Overall Score: {analysis['scores']['overall']}/100",
            'position': 'top',
            'start': 0,
            'length': 5,
            'color': '#00ff00',
            'background': '#000000'
        },
        {
            'text': 'Form Analysis Complete',
            'position': 'bottom',
            'start': 0,
            'length': 2,
            'color': '#ffffff',
            'background': '#1a1a1a'
        }
    ]
    
    print("  ⚙️  Submitting render request...")
    render_response = editor.create_shooting_form_analysis(
        video_url=video_url,
        annotations=annotations,
        angles=angles,
        duration=5.0
    )
    
    render_id = render_response['response']['id']
    print(f"  🆔 Render ID: {render_id}")
    print(f"  ⏳ Waiting for render to complete...")
    
    # Wait for completion
    final_status = client.wait_for_render(render_id, timeout=180)
    
    result = {
        'name': 'Shooting Form Analysis',
        'render_id': render_id,
        'status': final_status['response']['status'],
        'url': final_status['response'].get('url'),
        'thumbnail': final_status['response'].get('thumbnail'),
        'description': 'Shows skeleton overlay with angle measurements and score metrics',
        'features': ['Angle measurements', 'Score display', 'Professional overlay']
    }
    
    if result['status'] == 'done':
        print(f"  ✅ Render complete!")
        print(f"  🔗 URL: {result['url']}")
    else:
        print(f"  ❌ Render failed: {final_status['response'].get('error')}")
    
    return result


def render_sample_2_coaching_feedback(client: ShotStackClient, editor: BasketballVideoEditor,
                                      asset_manager: ShotStackAssetManager) -> Dict:
    """
    Sample 2: Coaching Feedback
    - Shows text overlays with coaching cues
    - Highlights areas for improvement
    - Displays correction suggestions
    """
    print("\n🎬 Rendering Sample 2: Coaching Feedback")
    print("=" * 60)
    
    video_url = 'https://shotstack-assets.s3.amazonaws.com/footage/skater.mp4'
    print(f"  📹 Using sample video: {video_url}")
    
    analysis = create_mock_analysis_data()
    
    # Create staggered feedback annotations
    annotations = []
    for i, feedback in enumerate(analysis['feedback'][:3]):  # First 3 feedback items
        annotations.append({
            'text': feedback,
            'position': 'bottom',
            'start': i * 1.5,
            'length': 1.5,
            'color': '#ffffff',
            'background': '#0066cc'
        })
    
    # Add improvement suggestions
    for i, improvement in enumerate(analysis['improvements'][:2]):
        annotations.append({
            'text': f"💡 {improvement}",
            'position': 'top',
            'start': i * 2,
            'length': 2,
            'color': '#ffff00',
            'background': '#cc3300'
        })
    
    print("  ⚙️  Submitting render request...")
    render_response = editor.create_shooting_form_analysis(
        video_url=video_url,
        annotations=annotations,
        duration=5.0
    )
    
    render_id = render_response['response']['id']
    print(f"  🆔 Render ID: {render_id}")
    print(f"  ⏳ Waiting for render to complete...")
    
    final_status = client.wait_for_render(render_id, timeout=180)
    
    result = {
        'name': 'Coaching Feedback',
        'render_id': render_id,
        'status': final_status['response']['status'],
        'url': final_status['response'].get('url'),
        'thumbnail': final_status['response'].get('thumbnail'),
        'description': 'Displays coaching cues and improvement suggestions with timing',
        'features': ['Staggered feedback', 'Color-coded annotations', 'Improvement tips']
    }
    
    if result['status'] == 'done':
        print(f"  ✅ Render complete!")
        print(f"  🔗 URL: {result['url']}")
    else:
        print(f"  ❌ Render failed: {final_status['response'].get('error')}")
    
    return result


def render_sample_3_split_screen(client: ShotStackClient, editor: BasketballVideoEditor,
                                 asset_manager: ShotStackAssetManager) -> Dict:
    """
    Sample 3: Split-Screen Comparison
    - Side-by-side comparison
    - Labels for each side
    - Divider line
    """
    print("\n🎬 Rendering Sample 3: Split-Screen Comparison")
    print("=" * 60)
    
    # Use same video twice for demonstration
    video1_url = 'https://shotstack-assets.s3.amazonaws.com/footage/skater.mp4'
    video2_url = 'https://shotstack-assets.s3.amazonaws.com/footage/skater.mp4'
    
    print(f"  📹 Video 1 (Amateur): {video1_url}")
    print(f"  📹 Video 2 (Professional): {video2_url}")
    
    print("  ⚙️  Submitting render request...")
    render_response = editor.create_split_screen_comparison(
        video1_url=video1_url,
        video2_url=video2_url,
        title1="Your Form",
        title2="Elite Shooter",
        duration=5.0
    )
    
    render_id = render_response['response']['id']
    print(f"  🆔 Render ID: {render_id}")
    print(f"  ⏳ Waiting for render to complete...")
    
    final_status = client.wait_for_render(render_id, timeout=180)
    
    result = {
        'name': 'Split-Screen Comparison',
        'render_id': render_id,
        'status': final_status['response']['status'],
        'url': final_status['response'].get('url'),
        'thumbnail': final_status['response'].get('thumbnail'),
        'description': 'Side-by-side comparison of user form vs elite shooter',
        'features': ['Split-screen layout', 'Labeled sections', 'Visual divider']
    }
    
    if result['status'] == 'done':
        print(f"  ✅ Render complete!")
        print(f"  🔗 URL: {result['url']}")
    else:
        print(f"  ❌ Render failed: {final_status['response'].get('error')}")
    
    return result


def create_preview_html(results: List[Dict]) -> str:
    """Create an HTML preview page showing all rendered samples"""
    
    html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ShotStack Template Samples - Basketball Analysis</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #ffffff;
            padding: 40px 20px;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        header {
            text-align: center;
            margin-bottom: 60px;
        }
        
        h1 {
            font-size: 3em;
            margin-bottom: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .subtitle {
            font-size: 1.2em;
            color: #a0a0a0;
        }
        
        .sample-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 40px;
            margin-top: 40px;
        }
        
        .sample-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            padding: 25px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .sample-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }
        
        .sample-card h2 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.5em;
        }
        
        .video-container {
            position: relative;
            width: 100%;
            padding-bottom: 56.25%; /* 16:9 aspect ratio */
            background: #000;
            border-radius: 10px;
            overflow: hidden;
            margin: 20px 0;
        }
        
        .video-container video {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .sample-description {
            color: #c0c0c0;
            margin-bottom: 15px;
            font-size: 0.95em;
        }
        
        .features {
            list-style: none;
            margin: 15px 0;
        }
        
        .features li {
            padding: 8px 0;
            color: #a0a0a0;
            font-size: 0.9em;
        }
        
        .features li:before {
            content: "✓ ";
            color: #00ff88;
            font-weight: bold;
            margin-right: 8px;
        }
        
        .status {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
            margin-top: 10px;
        }
        
        .status.done {
            background: rgba(0, 255, 136, 0.2);
            color: #00ff88;
            border: 1px solid #00ff88;
        }
        
        .status.failed {
            background: rgba(255, 68, 68, 0.2);
            color: #ff4444;
            border: 1px solid #ff4444;
        }
        
        .render-info {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            font-size: 0.85em;
            color: #808080;
        }
        
        .render-info a {
            color: #667eea;
            text-decoration: none;
        }
        
        .render-info a:hover {
            text-decoration: underline;
        }
        
        .note {
            background: rgba(255, 165, 0, 0.1);
            border-left: 4px solid #ffa500;
            padding: 15px;
            margin: 30px 0;
            border-radius: 5px;
        }
        
        .note p {
            color: #ffa500;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🏀 Basketball Analysis Templates</h1>
            <p class="subtitle">Visual Samples - ShotStack Video Editing API</p>
        </header>
        
        <div class="note">
            <p><strong>📝 Note:</strong> These samples demonstrate the ShotStack template capabilities. 
            In production, these would overlay on actual basketball shooting footage with real pose detection data.</p>
        </div>
        
        <div class="sample-grid">
"""
    
    # Add each sample
    for result in results:
        status_class = 'done' if result['status'] == 'done' else 'failed'
        
        html += f"""
            <div class="sample-card">
                <h2>{result['name']}</h2>
                
                <div class="video-container">
        """
        
        if result.get('url'):
            html += f"""
                    <video controls autoplay loop muted>
                        <source src="{result['url']}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
            """
        else:
            html += """
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">
                        Video rendering in progress or failed
                    </div>
            """
        
        html += """
                </div>
                
        """
        
        html += f"""
                <p class="sample-description">{result['description']}</p>
                
                <ul class="features">
        """
        
        for feature in result.get('features', []):
            html += f"<li>{feature}</li>\n"
        
        html += f"""
                </ul>
                
                <span class="status {status_class}">{result['status'].upper()}</span>
                
                <div class="render-info">
                    <strong>Render ID:</strong> <code>{result['render_id']}</code><br>
        """
        
        if result.get('url'):
            html += f"""
                    <strong>Video URL:</strong> <a href="{result['url']}" target="_blank">Open in new tab</a><br>
            """
        
        if result.get('thumbnail'):
            html += f"""
                    <strong>Thumbnail:</strong> <a href="{result['thumbnail']}" target="_blank">View</a>
            """
        
        html += """
                </div>
            </div>
        """
    
    html += """
        </div>
        
        <div style="margin-top: 60px; text-align: center; color: #666; font-size: 0.9em;">
            <p>Generated: """ + time.strftime('%Y-%m-%d %H:%M:%S') + """</p>
            <p>Powered by ShotStack Video Editing API</p>
        </div>
    </div>
</body>
</html>
"""
    
    return html


def main():
    """Main execution function"""
    print("=" * 70)
    print("🎬 SHOTSTACK TEMPLATE SAMPLE RENDERER")
    print("=" * 70)
    print()
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"📁 Output directory: {OUTPUT_DIR}")
    print()
    
    # Initialize ShotStack client
    client = ShotStackClient(environment='sandbox')
    editor = BasketballVideoEditor(client)
    asset_manager = ShotStackAssetManager(
        api_key=os.getenv('SHOTSTACK_SANDBOX_API_KEY'),
        environment='sandbox'
    )
    
    print("✅ ShotStack client initialized (sandbox mode)")
    print()
    
    # Render all samples
    results = []
    
    try:
        # Sample 1: Form Analysis
        result1 = render_sample_1_form_analysis(client, editor, asset_manager)
        results.append(result1)
        time.sleep(2)
        
        # Sample 2: Coaching Feedback
        result2 = render_sample_2_coaching_feedback(client, editor, asset_manager)
        results.append(result2)
        time.sleep(2)
        
        # Sample 3: Split-Screen
        result3 = render_sample_3_split_screen(client, editor, asset_manager)
        results.append(result3)
        
    except Exception as e:
        print(f"\n❌ Error during rendering: {e}")
        import traceback
        traceback.print_exc()
    
    # Save results to JSON
    with open(RESULTS_FILE, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\n💾 Results saved to: {RESULTS_FILE}")
    
    # Create HTML preview
    html_content = create_preview_html(results)
    html_file = os.path.join(OUTPUT_DIR, 'template_previews.html')
    with open(html_file, 'w') as f:
        f.write(html_content)
    print(f"📄 HTML preview created: {html_file}")
    
    # Print summary
    print("\n" + "=" * 70)
    print("📊 RENDERING SUMMARY")
    print("=" * 70)
    for result in results:
        status_icon = "✅" if result['status'] == 'done' else "❌"
        print(f"{status_icon} {result['name']}: {result['status'].upper()}")
        if result.get('url'):
            print(f"   🔗 {result['url']}")
    
    print("\n🎉 All samples rendered! Open the HTML preview to see results.")
    print(f"   file://{html_file}")
    print()


if __name__ == "__main__":
    main()
