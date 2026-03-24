#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use std::sync::Mutex;
use tauri::{Manager, RunEvent};
use tauri_plugin_dialog::DialogExt;

// --- ADDED: Menu Imports for macOS ---
#[cfg(target_os = "macos")]
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
#[cfg(target_os = "macos")]
use tauri_plugin_opener::OpenerExt;
// -------------------------------------

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {

            // --- ADDED: Disable Native Title Bar on Windows & Linux ---
            #[cfg(not(target_os = "macos"))]
            {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_decorations(false);
                }
            }
            
            // --- ADDED: Custom macOS Menu Setup ---
            #[cfg(target_os = "macos")]
            {
                let handle = app.handle();
                
                // 1. Standard App Menu (Quit, Hide, etc.)
                let app_submenu = Submenu::with_items(
                    handle,
                    "SRT Translator",
                    true,
                    &[
                        &PredefinedMenuItem::about(handle, None, None)?,
                        &PredefinedMenuItem::separator(handle)?,
                        &PredefinedMenuItem::services(handle, None)?,
                        &PredefinedMenuItem::separator(handle)?,
                        &PredefinedMenuItem::hide(handle, None)?,
                        &PredefinedMenuItem::hide_others(handle, None)?,
                        &PredefinedMenuItem::show_all(handle, None)?,
                        &PredefinedMenuItem::separator(handle)?,
                        &PredefinedMenuItem::quit(handle, None)?,
                    ],
                )?;

                // 2. Standard Edit Menu (Copy, Paste, Undo, etc.)
                let edit_submenu = Submenu::with_items(
                    handle,
                    "Edit",
                    true,
                    &[
                        &PredefinedMenuItem::undo(handle, None)?,
                        &PredefinedMenuItem::redo(handle, None)?,
                        &PredefinedMenuItem::separator(handle)?,
                        &PredefinedMenuItem::cut(handle, None)?,
                        &PredefinedMenuItem::copy(handle, None)?,
                        &PredefinedMenuItem::paste(handle, None)?,
                        &PredefinedMenuItem::select_all(handle, None)?,
                    ],
                )?;

                // 3. Custom Help Menu
                let help_item = MenuItem::with_id(handle, "github_help", "View Documentation on GitHub", true, None::<&str>)?;
                let help_submenu = Submenu::with_items(
                    handle,
                    "Help",
                    true,
                    &[&help_item],
                )?;

                // Set the menu to the app
                let menu = Menu::with_items(handle, &[&app_submenu, &edit_submenu, &help_submenu])?;
                app.set_menu(menu)?;

                // Listen for clicks on the custom help item
                app.on_menu_event(move |app_handle, event| {
                    if event.id().as_ref() == "github_help" {
                        if let Err(e) = app_handle.opener().open_url("https://github.com/VjayC/SRT-Subtitle-Translator-Validator#desktop-application-specifics", None::<&str>) {
                            eprintln!("Failed to open help URL: {}", e);
                        }
                    }
                });
            }
            // --------------------------------------

            // 1. Check if Java is installed BEFORE trying to start the backend
            if Command::new("java").arg("-version").output().is_err() {
                app.dialog()
                    .message("Java Runtime Environment (JRE) was not found on your system.\n\nThis application requires Java 17 or higher to run its local validation engine.\n\nPlease download and install Java from adoptium.net and restart the application.")
                    .title("Missing Dependency: Java")
                    .kind(tauri_plugin_dialog::MessageDialogKind::Error)
                    .blocking_show();
                
                std::process::exit(1);
            }

            // 2. Dynamically resolve the absolute path to the bundled JAR file
            let resource_path = app.path()
                .resolve("binaries/backend-0.0.1-SNAPSHOT.jar", tauri::path::BaseDirectory::Resource)
                .expect("Failed to find bundled backend-0.0.1-SNAPSHOT.jar");

            // 3. Spawn the Java process safely
            let backend_process = Command::new("java")
                .args(["-jar", resource_path.to_str().unwrap()])
                .spawn()
                .expect("Failed to start Spring Boot backend.");

            // 4. Save the process handle safely in Tauri's state manager
            app.manage(Mutex::new(backend_process));

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app_handle, event| {
            if let RunEvent::Exit = event {
                println!("Application is exiting. Sending graceful shutdown to backend...");
                
                let _ = Command::new("curl")
                    .args(["-X", "POST", "http://localhost:8080/api/proxy/shutdown"])
                    .output();

                if let Some(process_mutex) = app_handle.try_state::<Mutex<std::process::Child>>() {
                    if let Ok(mut process) = process_mutex.lock() {
                        let _ = process.kill();
                    }
                }
            }
        });
}