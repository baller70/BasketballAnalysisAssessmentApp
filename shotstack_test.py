#!/usr/bin/env python3
"""
ShotStack API Test Script
Tests the ShotStack integration for basketball analysis
"""

import sys
import json
from shotstack_helpers import ShotStackClient, BasketballVideoEditor

def test_connection():
    """Test API connection"""
    print("\n" + "="*60)
    print("TEST 1: API Connection")
    print("="*60)
    
    try:
        client = ShotStackClient(environment='sandbox')
        print("✓ ShotStack client initialized")
        print(f"  Environment: sandbox")
        print(f"  Endpoint: {client.endpoint}")
        print(f"  API Key: {client.api_key[:10]}...")
        return True
    except Exception as e:
        print(f"✗ Failed to initialize client: {e}")
        return False

def test_simple_render():
    """Test simple video render with text overlay"""
    print("\n" + "="*60)
    print("TEST 2: Simple Text Overlay")
    print("="*60)
    
    try:
        client = ShotStackClient(environment='sandbox')
        
        # Use a public test video from ShotStack
        test_video = "https://shotstack-assets.s3.amazonaws.com/footage/beach-overhead.mp4"
        
        edit_config = {
            "timeline": {
                "background": "#000000",
                "tracks": [
                    # Base video
                    {
                        "clips": [{
                            "asset": {
                                "type": "video",
                                "src": test_video
                            },
                            "start": 0,
                            "length": 3
                        }]
                    },
                    # Text overlay
                    {
                        "clips": [{
                            "asset": {
                                "type": "text",
                                "text": "Basketball Analysis Test",
                                "font": {
                                    "family": "Arial",
                                    "size": 48,
                                    "color": "#ffffff",
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
                            "start": 0,
                            "length": 3,
                            "position": "bottom"
                        }]
                    }
                ]
            },
            "output": {
                "format": "mp4",
                "fps": 25,
                "size": {
                    "width": 1280,
                    "height": 720
                }
            }
        }
        
        print("Submitting render request...")
        response = client.render_video(edit_config)
        
        render_id = response['response']['id']
        print(f"✓ Render submitted successfully")
        print(f"  Render ID: {render_id}")
        print(f"  Status: {response['response']['status']}")
        
        print("\nWaiting for render to complete (this may take 30-60 seconds)...")
        status = client.wait_for_render(render_id, timeout=120)
        
        if status['response']['status'] == 'done':
            print(f"✓ Render completed successfully!")
            print(f"  Output URL: {status['response']['url']}")
            return True
        else:
            print(f"✗ Render failed")
            print(f"  Error: {status['response'].get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_basketball_editor():
    """Test BasketballVideoEditor class"""
    print("\n" + "="*60)
    print("TEST 3: Basketball Video Editor")
    print("="*60)
    
    try:
        client = ShotStackClient(environment='sandbox')
        editor = BasketballVideoEditor(client)
        
        print("✓ BasketballVideoEditor initialized")
        
        # Test with sample data
        test_video = "https://shotstack-assets.s3.amazonaws.com/footage/beach-overhead.mp4"
        
        annotations = [
            {
                'text': 'Good elbow alignment',
                'start': 0,
                'length': 1.5,
                'position': 'bottom',
                'color': '#00ff00',
                'background': '#000000'
            },
            {
                'text': 'Follow through needs work',
                'start': 1.5,
                'length': 1.5,
                'position': 'bottom',
                'color': '#ffff00',
                'background': '#000000'
            }
        ]
        
        angles = [
            {
                'name': 'Elbow',
                'value': 90.5,
                'position': {'x': 0.2, 'y': 0},
                'start': 0,
                'length': 3
            }
        ]
        
        print("Creating shooting form analysis video...")
        response = editor.create_shooting_form_analysis(
            video_url=test_video,
            annotations=annotations,
            angles=angles,
            duration=3.0
        )
        
        render_id = response['response']['id']
        print(f"✓ Analysis video render submitted")
        print(f"  Render ID: {render_id}")
        print(f"  Annotations: {len(annotations)}")
        print(f"  Angle measurements: {len(angles)}")
        
        print("\nWaiting for render to complete...")
        status = client.wait_for_render(render_id, timeout=120)
        
        if status['response']['status'] == 'done':
            print(f"✓ Analysis video completed!")
            print(f"  Output URL: {status['response']['url']}")
            return True
        else:
            print(f"✗ Render failed")
            return False
            
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_split_screen():
    """Test split-screen comparison"""
    print("\n" + "="*60)
    print("TEST 4: Split-Screen Comparison")
    print("="*60)
    
    try:
        client = ShotStackClient(environment='sandbox')
        editor = BasketballVideoEditor(client)
        
        # Use same video for both sides (just for testing)
        test_video = "https://shotstack-assets.s3.amazonaws.com/footage/beach-overhead.mp4"
        
        print("Creating split-screen comparison...")
        response = editor.create_split_screen_comparison(
            video1_url=test_video,
            video2_url=test_video,
            title1="Before Coaching",
            title2="After Coaching",
            duration=3.0
        )
        
        render_id = response['response']['id']
        print(f"✓ Split-screen render submitted")
        print(f"  Render ID: {render_id}")
        
        print("\nWaiting for render to complete...")
        status = client.wait_for_render(render_id, timeout=120)
        
        if status['response']['status'] == 'done':
            print(f"✓ Split-screen video completed!")
            print(f"  Output URL: {status['response']['url']}")
            return True
        else:
            print(f"✗ Render failed")
            return False
            
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("SHOTSTACK API INTEGRATION TEST SUITE")
    print("="*60)
    print("Testing ShotStack integration for basketball analysis")
    print("Environment: SANDBOX (watermarked)")
    
    results = []
    
    # Test 1: Connection
    results.append(("API Connection", test_connection()))
    
    # Test 2: Simple render
    if results[0][1]:  # Only if connection works
        results.append(("Simple Text Overlay", test_simple_render()))
    
    # Test 3: Basketball editor
    if results[0][1]:
        results.append(("Basketball Video Editor", test_basketball_editor()))
    
    # Test 4: Split screen
    if results[0][1]:
        results.append(("Split-Screen Comparison", test_split_screen()))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    for test_name, passed in results:
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{test_name:.<40} {status}")
    
    total = len(results)
    passed = sum(1 for _, p in results if p)
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! ShotStack integration is working correctly.")
        return 0
    else:
        print("\n⚠️  Some tests failed. Check the output above for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
