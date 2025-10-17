# SRT Translator & Validator

<p align="center">
  <img src="./icon.svg" width="128" height="128" alt="SRT Translator & Validator Icon">
</p>

<p align="center">
<a href="https://github.com/VjayC/SRT-Subtitle-Translator-Validator/blob/main/LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/License-MIT-28a745" style="max-width: 100%;"></a>
<a href="https://github.com/VjayC/SRT-Subtitle-Translator-Validator"><img alt="Star this repo" src="https://img.shields.io/github/stars/VjayC/SRT-Subtitle-Translator-Validator.svg?style=social&amp;label=Star%20this%20repo&amp;maxAge=60" style="max-width: 100%;"></a></p>
</p>

A comprehensive browser-based tool that leverages Large Language Models (LLMs) to translate SRT subtitle files and automatically validate the output for common errors. Built specifically to create high-quality, script-accurate subtitles using your existing Gemini subscription via [CLI Proxy API](https://github.com/router-for-me/CLIProxyAPI).

## Motivation

My mom loves to watch movies and TV shows, but she isn't fluent in English. Properly translated subtitles are the perfect way for her to enjoy and understand the content. While Large Language Models (LLMs) are incredibly powerful and can translate subtitles in seconds, they often introduce subtle errors, such as:

* **Timestamp Drift:** The model may slightly alter timestamps, causing subtitles to appear too early or too late.
* **Character "Hallucinations":** When translating for a specific language (like Telugu), the model might mistakenly insert characters from a similar-looking but incorrect script (like Devanagari, Tamil, or Kannada).
* **Incomplete Translations:** Long subtitle files may be cut off mid-translation.
* **Formatting Errors:** Line breaks or subtitle numbering can sometimes be corrupted.

This tool automates the entire translation workflow, validates the output, and provides one-click fixes for common LLM errors—ensuring the subtitles are perfect.

## What This Tool Replaces

This is the successor to my original SRT Subtitle Validator, which could only validate pre-translated files. The new **SRT Translator & Validator** combines translation and validation into a single, streamlined workflow with automatic error correction.

## Features

### Translation
- **Direct LLM Integration:** Translate subtitles using your Gemini subscription (via CLI Proxy API)
- **Customizable Prompts:** Full markdown editor with live preview for translation instructions
- **Partial Translation Recovery:** Automatically detects incomplete translations and continues from where it stopped
- **Language Detection:** Automatically identifies the target language for proper filename generation
- **Raw Output Logging:** Saves all Gemini responses with timestamps for debugging

### Validation
- **Timestamp Synchronization:** Compares timestamps between source and translated files, reporting any mismatches with detailed ranges
- **Script Validation:** Ensures translated text only contains characters from allowed Unicode ranges (e.g., English + Telugu)
- **Configurable Character Sets:** Search from 130+ language scripts or add custom Unicode ranges/characters
- **Real-time Feedback:** Color-coded error reports with subtitle indices and Unicode values

### Automatic Error Correction
- **Fix Timestamp Errors:** One-click replacement of incorrect timestamps with source values
- **Fix Script Errors:** Sends problematic subtitles back to Gemini for automatic correction
- **Combined Fixing:** Handles both timestamp and script errors in a single operation
- **Smart Validation:** Re-checks after fixes and shows remaining issues

### User Experience
- **Editable Output:** View and manually edit translated subtitles before downloading
- **Auto-save:** Preserve manual edits while continuing the workflow
- **Progress Tracking:** Browser tab title shows current status (Translating, Translated, Fixing, Fixed, Error)
- **Auto-scroll:** Automatically scrolls to validation results
- **Dark/Light Mode:** Adapts to your system theme preference

## Prerequisites

### CLI Proxy API Installation

CLI Proxy API is required to access your Gemini subscription through an API interface.

#### Install via Homebrew (Recommended)
```bash
brew install cliproxyapi
```

#### Or Build from Source
1. Clone the repository:
```bash
git clone https://github.com/luispater/CLIProxyAPI.git
cd CLIProxyAPI
```

2.  Build the application:
    * **Linux, macOS:**
        ```bash
        go build -o cli-proxy-api ./cmd/server
        ```
    * **Windows:**
        ```shell
        go build -o cli-proxy-api.exe ./cmd/server
        ```

### Gemini Authentication

**Important:** During login, you may need to choose or create a Google Cloud project. **Select a project with no billing account linked** to avoid unexpected charges. You can manage your projects at [console.cloud.google.com](https://console.cloud.google.com).

1. Run the login command:
```bash
cliproxyapi --login
```

If you're an existing Gemini Code user:
```bash
cliproxyapi --login --project_id <your_project_id>
```

2. Follow the OAuth flow in your browser to authenticate
3. The local OAuth callback uses port `8085`

### Configuration

Create or edit your `config.yaml` file:

```yaml
# Server port
port: 8317

# Authentication directory
auth-dir: "~/.cli-proxy-api"

# API keys for authentication
api-keys:
  - "your-api-key-here"  # Choose any value, must match the web app

# Disable management panel (optional)
remote-management:
  disable-control-panel: true
```

**Important:** The `api-keys` value in `config.yaml` must match the API Key field in the web application.

## Usage

### 1. Start CLI Proxy API Server

If installed via Homebrew:
```bash
/opt/homebrew/opt/cliproxyapi/bin/cliproxyapi --config ~/path/to/your/config.yaml
```

If built from source:
```bash
./cli-proxy-api --config /path/to/your/config.yaml
```

The server will start on `http://localhost:8317` by default.

### 2. Open the Web Application

Open this link [`SRT Translator & Validator`](https://vjayc.github.io/SRT-Subtitle-Translator-Validator/) in any modern web browser.

### 3. Configure the Application

1. **CLI Proxy API Endpoint:** Default is `http://localhost:8317/v1/chat/completions`
2. **Model Name:** Default is `gemini-2.5-pro`
3. **API Key:** Enter the same key from your `config.yaml` (e.g., `1234567`)

### 4. Set Up Allowed Scripts

By default, the tool allows:
- Basic Latin (English alphabet)
- Latin Supplement (é, ñ, etc.)
- Special characters (quotes, em-dash, line breaks)

To add your target language:
1. Type the language name in the search bar (e.g., "Telugu", "Arabic", "Tamil")
2. Click the suggested script to add it
3. Or add custom Unicode ranges: `U+0C00-U+0C7F` or single characters: `U+0C00`

You can also remove any script (except special characters and line breaks) by clicking the × button.

### 5. Create Your Translation Prompt

Write your translation instructions in the prompt field. You can use markdown formatting and switch to **Markdown View** to preview how it renders.

**Example Prompt:**
```markdown
You are a hyper-vigilant subtitle translator and formatter. Your task is to translate an English .srt file into casual "Tenglish" (a mix of Telugu and English). Your primary directive is 100% accuracy in timestamps and script usage. Failure to adhere to these rules is not an option.

**Goal:** Translate the attached English .srt file for the TV show Psych (2006), S02E02, (65 Million Years Off) into casual Telugu for a native speaker who is not fluent in complex English.

### Core Directives (Must be followed without exception):

**ABSOLUTE TIMESTAMP INTEGRITY:** This is the most critical rule. The timestamps in the output file MUST BE an exact, character-for-character, byte-for-byte copy of the timestamps in the source file. Treat the entire timestamp line (HH:MM:SS,ms --> HH:MM:SS,ms) as a single, unchangeable piece of data—a unique ID that must be copied exactly as it appears. Do not parse, interpret, round, or alter it in any way. A single missing or incorrect character is a total failure.

✅ **CORRECT:** 00:14:56,928 (From Input SRT)
❌ **INCORRECT:** 00:14:6,928 (Single Digit Missing)
❌ **INCORRECT:** 00:14:46,928 (Single Digit Mismatch)
❌ **INCORRECT:** 00:14:33,928 (Double Digit Mismatch)

**PERFECT LINE BREAKS:** Preserve the original line breaks within each subtitle entry. If the original English subtitle has two lines, the translated Tenglish subtitle must also have two lines. Do not merge lines.

**STRICT SCRIPT CONTROL:**

- The final text may ONLY contain characters from the English (Latin) alphabet and the Telugu script.
- ABSOLUTELY NO characters from any other script are allowed. This includes, but is not limited to, Devanagari (Hindi: नी), Gujarati (હ), Japanese (気), Tamil (த), Kannada (ಚಿ), or Malayalam (മ). Any character not in the standard English or Telugu alphabets is forbidden.

**"TENGLISH" STYLE:**

- Keep common English words, names (Shawn Spencer), and simple phrases (Who's in there?) in English.
- Translate complex English words (requisitioning) into simple, casual Telugu.
- Do not transliterate Telugu words into English letters. Use the Telugu script.

### Error Correction Examples (Pay close attention to these):

This table shows the exact type of script errors to avoid and their correct replacements.

| Original English | ❌ Incorrect Translation (Mistake) | ✅ Correct Translation (Goal) |
|---|---|---|
| - I can't see a thing in here.<br>- I got it. | ఇక్కడ నాకు ఏమీ కనపడట్లేదు. నా దగ్గర ఉంది. (Merged lines) | - ఇక్కడ నాకు ఏమీ కనపడట్లేదు.<br>- నా దగ్గర ఉంది. (Correctly kept two lines) |
| a killer's window | ఒక હત్యకుడి window (Uses Gujarati હ) | ఒక హత్యకుడి window (Uses correct Telugu హ) |
| if you don't mind | మీరు気に పట్టించుకోకపోతే (Uses Japanese 気) | మీరు పట్టించుకోకపోతే (Uses correct Telugu script only) |
| I am not a suspect | నేను suspect नी కాదు (Uses Devanagari नी) | నేను suspect ని కాదు (Uses correct Telugu ని) |

### Final Verification Protocol:

Before providing the final output, perform a self-correction check. Review your entire translated file one last time to confirm:

1. **Timestamp Check:** Is every single digit of every timestamp identical to the source?
2. **Line Break Check:** Does the line count of every subtitle entry match the source exactly?
3. **Script Check:** Have you scanned the entire text to ensure there are zero characters from any script other than English and Telugu? Verify common error characters like హ vs. હ.

Please begin the translation of the attached file, adhering strictly to these enhanced directives.
```

### 6. Upload and Translate

1. Click "Choose Input SRT file..." and select your English subtitle file
2. Click **"Translate with Gemini"**
3. The tool will:
   - Detect the target language
   - Send the file to Gemini for translation
   - Automatically validate the output
   - Show any errors found

### 7. Handle Partial Translations

If Gemini stops mid-translation, you'll see:
- "⚠️ Partial Translation Detected!"
- Progress: "Translated: 250 / 500 subtitles"
- A **"⏩ Continue Translating"** button

Click the button to automatically resume translation from where it stopped. This process repeats until the file is complete.

### 8. Review and Edit

- View the translated subtitles in the editable text area
- Make manual corrections if needed
- Click **"💾 Save Edits"** to preserve changes

### 9. Fix Errors Automatically

If validation found errors, click **"🔧 Fix All Errors"** to:
- Automatically correct timestamp mismatches
- Send script errors back to Gemini for correction
- Re-validate and show remaining issues

### 10. Download Your Files

- **"💾 Download Translated SRT"**: Downloads the corrected subtitle file
  - Filename format: `OriginalName(Language)(Model).srt`
  - Example: `Psych.S04E05.1080p.BluRay.Remux.eng(Tenglish)(Gemini 2.5 Pro).srt`
- **"📄 Download Raw Output"**: Downloads all Gemini responses with timestamps for debugging

## Supported Languages

The tool includes 130+ pre-configured language scripts:

- **Indian:** Telugu, Hindi, Tamil, Bengali, Gujarati, Kannada, Malayalam, Punjabi, Odia, Sinhala
- **East Asian:** Chinese (6 CJK blocks), Japanese (Hiragana, Katakana), Korean (Hangul)
- **Southeast Asian:** Thai, Lao, Burmese, Khmer, Tagalog, Balinese, Sundanese, Javanese
- **Middle Eastern:** Arabic (5 variants), Hebrew, Persian, Urdu, Syriac
- **European:** Greek, Cyrillic (4 variants), Armenian, Georgian
- **African:** Ethiopic, Tifinagh, Coptic, Vai, Bamum
- **Historical:** Egyptian Hieroglyphs, Cuneiform, Phoenician, Linear B, Runic, Ogham
- **And many more...**

You can also add any custom Unicode range or character.

## Troubleshooting

### "Translation Error: Failed to fetch"
- Ensure CLI Proxy API is running: `ps aux | grep cliproxyapi`
- Check the endpoint URL matches: `http://localhost:8317/v1/chat/completions`
- Verify the port in `config.yaml` matches (default: 8317)

### "No subtitles were translated"
- Check your Gemini quota/limits
- Try using `gemini-2.5-flash` instead of `gemini-2.5-pro`
- Verify your prompt is clear and includes the SRT file content

### "API Error: 401 Unauthorized"
- Ensure the API Key in the web app matches `api-keys` in `config.yaml`
- Try re-logging in: `cliproxyapi --login`

### Script validation errors persist after fixing
- Some errors may require manual correction
- Check that you've added all necessary language scripts (e.g., Telugu)
- Review the raw output file for Gemini's explanation

### Partial translations don't complete
- Gemini may have hit token limits; try splitting the file manually
- Check the raw output file to see where Gemini stopped

## Advanced Configuration

### Using Different Models

Edit the Model Name field to use other models:
- `gemini-2.5-flash`: Faster, cheaper, good for simple translations
- `gemini-2.5-pro`: More accurate, better for complex translations
- See [CLI Proxy API docs](https://github.com/router-for-me/CLIProxyAPI) for all supported models

**Important:** The application has only been tested with `gemini-2.5-pro`

### Custom Unicode Ranges

Add specific character ranges for edge cases:
- Emoji: `U+1F600-U+1F64F`
- Mathematical symbols: `2200-22FF`
- Box drawing: `2500-257F`
- Any single character: `U+20AC` (€ symbol)

## Contributing

Contributions are welcome! Some areas for improvement:
- Support for streaming responses (real-time translation preview)
- Batch file processing
- Export validation reports as JSON/CSV
- Integration with other LLM providers

**Note:** Gemini was chosen due to a comparatively higher output token limit for its web client

## Credits

- Built on top of [CLI Proxy API](https://github.com/router-for-me/CLIProxyAPI)
- Inspired by the need for accessible, quality subtitles for non-English speakers

## License

MIT License - see LICENSE file for details

---

Made with ❤️ for my mom and anyone else who wants to enjoy content in their native language.