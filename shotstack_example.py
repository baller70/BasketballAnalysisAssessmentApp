#!/usr/bin/env python3
"""
ShotStack Basketball Analysis Example
Demonstrates how to create basketball analysis videos
"""

import json
from shotstack_helpers import ShotStackClient, BasketballVideoEditor

def example_1_simple_annotation():
    """Example 1: Add simple text annotation to video"""
    print("\n" + "="*60)
    print("EXAMPLE 1: Simple Text Annotation")
    print("="*60)
    
    client = ShotStackClient(environment='sandbox')
    editor = BasketballVideoEditor(client)
    
    # Configuration
    video_url = "https://example.com/basketball_shot.mp4"
    
    annotations = [
        {
            'text': 'Good elbow alignment!',
            'start': 0,
            'length': 2,
            'position': 'bottom',
            'color': '#00ff00',
            'background': '#000000'
        }
    ]
    
    # This would create the video (not executing to save credits)
    print("\nConfiguration:")
    print(f"  Video: {video_url}")
    print(f"  Annotations: {len(annotations)}")
    print(f"  Text: '{annotations[0]['text']}'")
    print(f"  Duration: {annotations[0]['length']} seconds")
    
    print("\n✓ Ready to render with:")
    print("  response = editor.create_shooting_form_analysis(")
    print(f"      video_url='{video_url}',")
    print(f"      annotations=annotations,")
    print(f"      duration=5.0")
    print("  )")

def example_2_angle_measurements():
    """Example 2: Add angle measurements"""
    print("\n" + "="*60)
    print("EXAMPLE 2: Angle Measurements")
    print("="*60)
    
    angles = [
        {
            'name': 'Elbow Angle',
            'value': 90.5,
            'position': {'x': 0.2, 'y': 0.0},
            'start': 0,
            'length': 5
        },
        {
            'name': 'Knee Bend',
            'value': 135.0,
            'position': {'x': 0.1, 'y': 0.3},
            'start': 0,
            'length': 5
        },
        {
            'name': 'Release Angle',
            'value': 45.0,
            'position': {'x': 0.3, 'y': -0.2},
            'start': 2,
            'length': 3
        }
    ]
    
    print("\nAngle Measurements:")
    for angle in angles:
        print(f"  • {angle['name']}: {angle['value']}°")
        print(f"    Position: ({angle['position']['x']}, {angle['position']['y']})")
        print(f"    Timing: {angle['start']}s - {angle['start'] + angle['length']}s")
    
    print("\n✓ These angles would be drawn as circles with text labels")

def example_3_full_analysis():
    """Example 3: Complete shooting form analysis"""
    print("\n" + "="*60)
    print("EXAMPLE 3: Complete Shooting Form Analysis")
    print("="*60)
    
    # Simulated analysis results
    analysis_results = {
        'feedback': [
            '✓ Excellent elbow alignment at 90°',
            '✓ Good knee bend for power generation',
            '⚠ Follow through could be smoother',
            '✓ Great balance throughout the shot'
        ],
        'angles': {
            'elbow': {
                'value': 90.5,
                'position': {'x': 0.2, 'y': 0.0},
                'status': 'good'
            },
            'knee': {
                'value': 135.0,
                'position': {'x': 0.1, 'y': 0.3},
                'status': 'good'
            },
            'release': {
                'value': 45.0,
                'position': {'x': 0.3, 'y': -0.2},
                'status': 'needs_work'
            }
        },
        'overall_score': 85
    }
    
    print("\nAnalysis Results:")
    print(f"  Overall Score: {analysis_results['overall_score']}/100")
    print("\n  Feedback:")
    for feedback in analysis_results['feedback']:
        print(f"    {feedback}")
    
    print("\n  Angle Measurements:")
    for angle_name, angle_data in analysis_results['angles'].items():
        status_icon = '✓' if angle_data['status'] == 'good' else '⚠'
        print(f"    {status_icon} {angle_name.title()}: {angle_data['value']}°")
    
    print("\n✓ This would create a comprehensive analysis video with:")
    print("  • Original video")
    print("  • Skeleton overlay (optional)")
    print("  • Angle measurements with circles")
    print("  • Timed text annotations")
    print("  • Color-coded feedback")

def example_4_split_screen():
    """Example 4: Before/After comparison"""
    print("\n" + "="*60)
    print("EXAMPLE 4: Split-Screen Comparison")
    print("="*60)
    
    video1_url = "https://example.com/before_coaching.mp4"
    video2_url = "https://example.com/after_coaching.mp4"
    
    print("\nComparison Setup:")
    print(f"  Left Video: {video1_url}")
    print(f"  Title: 'Before Coaching'")
    print(f"  Right Video: {video2_url}")
    print(f"  Title: 'After 2 Weeks'")
    
    print("\n✓ This would create a split-screen video with:")
    print("  • Two videos side-by-side")
    print("  • Vertical divider line")
    print("  • Titles for each side")
    print("  • Synchronized playback")

def example_5_json_template():
    """Example 5: Show raw JSON template"""
    print("\n" + "="*60)
    print("EXAMPLE 5: Raw JSON Template")
    print("="*60)
    
    template = {
        "timeline": {
            "background": "#000000",
            "tracks": [
                # Track 1: Base video
                {
                    "clips": [{
                        "asset": {
                            "type": "video",
                            "src": "https://example.com/shot.mp4"
                        },
                        "start": 0,
                        "length": 5
                    }]
                },
                # Track 2: Text annotation
                {
                    "clips": [{
                        "asset": {
                            "type": "text",
                            "text": "Good form!",
                            "font": {
                                "family": "Arial",
                                "size": 36,
                                "color": "#00ff00",
                                "weight": 700
                            },
                            "alignment": {
                                "horizontal": "center",
                                "vertical": "center"
                            },
                            "background": {
                                "color": "#000000",
                                "opacity": 0.85
                            }
                        },
                        "start": 0,
                        "length": 2,
                        "position": "bottom"
                    }]
                },
                # Track 3: Angle measurement
                {
                    "clips": [{
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
                        "start": 0,
                        "length": 5,
                        "position": "center",
                        "offset": {"x": 0.2, "y": 0}
                    }]
                }
            ]
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
    
    print("\nJSON Template Structure:")
    print(json.dumps(template, indent=2))
    
    print("\n✓ This JSON would be sent to ShotStack API to render the video")

def main():
    """Run all examples"""
    print("\n" + "="*60)
    print("SHOTSTACK BASKETBALL ANALYSIS EXAMPLES")
    print("="*60)
    print("Demonstrating video analysis capabilities")
    print("(Not executing renders to save credits)")
    
    example_1_simple_annotation()
    example_2_angle_measurements()
    example_3_full_analysis()
    example_4_split_screen()
    example_5_json_template()
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print("\n✓ All examples configured successfully!")
    print("\nTo actually render videos:")
    print("  1. Use 'sandbox' environment for testing (watermarked)")
    print("  2. Use 'production' environment for final videos")
    print("  3. Run: python shotstack_test.py (for full API test)")
    print("\nIntegration with RoboFlow:")
    print("  1. Get video from user")
    print("  2. Run pose estimation (RoboFlow)")
    print("  3. Calculate angles and generate feedback")
    print("  4. Create analysis video (ShotStack)")
    print("  5. Return video URL to user")
    
    print("\n🎉 ShotStack integration is ready!")

if __name__ == "__main__":
    main()
