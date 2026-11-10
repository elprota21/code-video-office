Output build/hola-mundo.mp4
Set FontFamily "JetBrains Mono"
Set FontSize 28
Set Width 1280
Set Height 720
Set Theme "Catppuccin Mocha"
Set Padding 40
Set TypingSpeed 60ms
Set Shell "bash"

Type "python -c 'from greet import greet; print(greet(None))'"
Enter
Sleep 2s
Type "sed -i 's/+ name +/ + (name or \"mundo\") +/' greet.py"
Enter
Sleep 1s
Type "python -c 'from greet import greet; print(greet(None))'"
Enter
Sleep 3s
