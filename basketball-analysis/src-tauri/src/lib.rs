// SHOTIQ Basketball Analysis - Tauri Backend
// This file contains the Rust backend logic for the desktop application

use tauri::Manager;

// Custom Tauri commands
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to SHOTIQ Basketball Analysis.", name)
}

#[tauri::command]
async fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
async fn get_platform_info() -> serde_json::Value {
    serde_json::json!({
        "platform": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "family": std::env::consts::FAMILY,
    })
}

// Application setup
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Register plugins
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        // Register commands
        .invoke_handler(tauri::generate_handler![
            greet,
            get_app_version,
            get_platform_info
        ])
        // Setup handler
        .setup(|app| {
            // Log app startup
            println!("SHOTIQ Basketball Analysis Desktop App Started");
            println!("Platform: {}", std::env::consts::OS);
            
            // Get main window
            if let Some(window) = app.get_webview_window("main") {
                // Set window title
                let _ = window.set_title("SHOTIQ Basketball Analysis");
                
                // The HTML file will handle the splash screen and redirect
                // No need to redirect here - let the splash screen show first
                
                // Enable devtools in development
                #[cfg(debug_assertions)]
                {
                    window.open_devtools();
                }
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
