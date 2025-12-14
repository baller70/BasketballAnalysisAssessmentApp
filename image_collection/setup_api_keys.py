#!/usr/bin/env python3
"""
API Key Setup Helper

Guides user through obtaining API keys for image collection.
"""

import os
from pathlib import Path

def print_banner(text: str):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)

def main():
    print("╔═" * 30 + "╗")
    print("║" + " " * 28 + "API KEY SETUP HELPER" + " " * 28 + "║")
    print("╚═" * 30 + "╝")
    
    print("\n🔑 This script will help you set up API keys for image collection.")
    print("\n🎯 Target: Collect 500-1,000 basketball shooting images from multiple sources\n")
    
    # Check existing .env file
    env_file = Path(__file__).parent / ".env"
    if env_file.exists():
        print("✅ Found existing .env file")
        response = input("\n🔄 Do you want to update it? (y/n): ")
        if response.lower() != 'y':
            print("❌ Exiting...")
            return
    
    print_banner("REQUIRED: ANTHROPIC API KEY")
    print("🤖 Anthropic Claude API is REQUIRED for Vision AI filtering")
    print("🔒 We already have this key configured for you!")
    anthropic_key = "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"
    print("✅ Anthropic API key: Already configured\n")
    
    print_banner("OPTIONAL: IMAGE SOURCE APIs")
    print("📸 You need at least ONE of these to collect images:")
    print("   1. Pixabay (Recommended - Free, 100 searches/day)")
    print("   2. Pexels (Good - Free, 200 requests/hour)")
    print("   3. Unsplash (High Quality - Free, 50 requests/hour)")
    print("\n💡 TIP: Get all 3 keys for maximum image diversity!\n")
    
    # Pixabay
    print_banner("1. PIXABAY API KEY")
    print("🌐 Sign up: https://pixabay.com/api/docs/")
    print("🔑 Get your API key from: https://pixabay.com/accounts/login/\n")
    pixabay_key = input("📝 Enter Pixabay API key (or press Enter to skip): ").strip()
    
    # Pexels
    print_banner("2. PEXELS API KEY")
    print("🌐 Sign up: https://www.pexels.com/api/")
    print("🔑 Get your API key from: https://www.pexels.com/api/new/\n")
    pexels_key = input("📝 Enter Pexels API key (or press Enter to skip): ").strip()
    
    # Unsplash
    print_banner("3. UNSPLASH ACCESS KEY")
    print("🌐 Sign up: https://unsplash.com/developers")
    print("🔑 Create app and get Access Key (NOT Secret Key)\n")
    unsplash_key = input("📝 Enter Unsplash Access Key (or press Enter to skip): ").strip()
    
    # Summary
    print_banner("SUMMARY")
    configured_sources = []
    if pixabay_key:
        configured_sources.append("Pixabay")
    if pexels_key:
        configured_sources.append("Pexels")
    if unsplash_key:
        configured_sources.append("Unsplash")
    
    if not configured_sources:
        print("⚠️ WARNING: No image source APIs configured!")
        print("❌ You won't be able to collect images without at least one API key.")
        print("\n💡 Please run this script again and add at least one API key.")
        return
    
    print(f"✅ Configured sources: {', '.join(configured_sources)}")
    print(f"\n📊 Expected collection capacity:")
    
    total_capacity = 0
    if pixabay_key:
        print("   - Pixabay: ~200 images")
        total_capacity += 200
    if pexels_key:
        print("   - Pexels: ~200 images")
        total_capacity += 200
    if unsplash_key:
        print("   - Unsplash: ~200 images")
        total_capacity += 200
    
    print(f"\n🎯 Total potential: ~{total_capacity} images")
    
    if total_capacity < 500:
        print("\n⚠️ WARNING: Total capacity is less than target (500-1,000 images)")
        print("💡 Consider adding more API keys for better coverage.")
    else:
        print("\n✅ Great! This should give us enough images for the target.")
    
    # Write .env file
    print("\n💾 Writing configuration to .env file...")
    
    env_content = f"""# Image Collection API Keys
# Generated: {Path(__file__).name}

# Required for Vision AI filtering
ANTHROPIC_API_KEY={anthropic_key}

# Image source APIs
PIXABAY_API_KEY={pixabay_key or ''}
PEXELS_API_KEY={pexels_key or ''}
UNSPLASH_ACCESS_KEY={unsplash_key or ''}
"""
    
    with open(env_file, 'w') as f:
        f.write(env_content)
    
    print(f"✅ Configuration saved to: {env_file}")
    
    # Next steps
    print_banner("NEXT STEPS")
    print("✅ 1. API keys configured")
    print("🔄 2. Run: python multi_source_collector.py")
    print("🔄 3. Run: python vision_ai_filter.py")
    print("🔄 4. Open: approval_interface/index.html")
    print("\n🚀 Ready to collect images!\n")

if __name__ == "__main__":
    main()
