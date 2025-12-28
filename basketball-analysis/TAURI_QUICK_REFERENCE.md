# 🚀 Tauri Desktop - Quick Reference

## Commands

```bash
# Development (hot-reload)
npm run tauri:dev

# Production build (current platform)
npm run tauri:build

# Platform-specific builds
npm run tauri:build:mac      # macOS Universal
npm run tauri:build:win      # Windows
npm run tauri:build:linux    # Linux

# Tauri CLI
npm run tauri info           # System info
npm run tauri icon <path>    # Generate icons
```

## File Locations

```
src-tauri/
├── Cargo.toml              # Rust dependencies
├── tauri.conf.json         # App configuration
├── src/
│   ├── lib.rs              # Main Rust code
│   └── main.rs             # Entry point
└── icons/                  # App icons

Build output:
src-tauri/target/release/bundle/
├── dmg/                    # macOS
├── msi/                    # Windows
└── deb/appimage/           # Linux
```

## Configuration

**App Details:**
- Name: SHOTIQ Basketball Analysis
- ID: com.shotiq.basketball.analysis
- Window: 1200x800 (min: 800x600)

**Plugins Enabled:**
- Store (persistent storage)
- FS (file system)
- Dialog (native dialogs)
- Shell (open URLs)

## Rust Commands (in lib.rs)

```rust
// Available from frontend:
greet(name: string) -> string
get_app_version() -> string
get_platform_info() -> object
```

## Using from TypeScript

```typescript
import { invoke } from '@tauri-apps/api/core'

// Call Rust command
const greeting = await invoke('greet', { name: 'User' })
const version = await invoke('get_app_version')
const platform = await invoke('get_platform_info')

// Use Tauri store
import { Store } from '@tauri-apps/plugin-store'
const store = new Store('.shotiq-store.dat')
await store.set('key', value)
const value = await store.get('key')
```

## Troubleshooting

**Blank window?**
- Check Next.js dev server is running
- Check console for errors
- Clear cache: `rm -rf .next out`

**Build fails?**
- Run `cargo check` in src-tauri/
- Check `tauri.conf.json` syntax
- Ensure icons exist

**Icons missing?**
- Run: `npm run tauri icon app-icon.svg -o src-tauri/icons`

## Next Steps

1. Test: `npm run tauri:dev`
2. Develop your app
3. Build: `npm run tauri:build`
4. Distribute installers

**Full docs:** See `TAURI_INSTALLATION_COMPLETE.md`
