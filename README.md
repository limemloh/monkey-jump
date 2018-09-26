# Monkey Jump

[![APM Version](https://img.shields.io/apm/v/monkey-jump.svg)](https://atom.io/packages/monkey-jump)
[![APM Downloads](https://img.shields.io/apm/dm/monkey-jump.svg)](https://atom.io/packages/monkey-jump)

_Use the keyboard to navigate everywhere in Atom._

## Features

#### `monkey:jump`

Click on any clickable GUI component in Atom.
<br>Default: `ctrl-y ctrl-y`

## <img src="https://github.com/limemloh/monkey-jump/blob/master/resources/monkey-jump.gif?raw=true" width="500" >

#### `monkey:jump-word`

Jump to any word in the buffer.
<br>Default: `ctrl-y w`

## <img src="https://github.com/limemloh/monkey-jump/blob/master/resources/monkey-jump-word.gif?raw=true" width="500" >

#### `monkey:jump-line`

Jump to any line in the buffer.
<br>Default: `ctrl-y l`

## <img src="https://github.com/limemloh/monkey-jump/blob/master/resources/monkey-jump-line.gif?raw=true" width="500" >

#### `monkey:select-selection`

Select one of multiple selections.
<br>Default: `ctrl-y s`

## <img src="https://github.com/limemloh/monkey-jump/blob/master/resources/monkey-select-selection.gif?raw=true" width="500" >

#### `monkey:select-multiple-selections`

Select multiple selections and discards the rest. After the selecting press any non-target key to execute.
<br>Default: `ctrl-y ctrl-s`

<img src="https://github.com/limemloh/monkey-jump/blob/master/resources/monkey-select-multiple-selections.gif?raw=true" width="500" >

### Installation

```
apm install monkey-jump
```

### Styling

If you want to style the hints you could add something like this in your own `styles.less`

```css
.monkey-jump-hint {
  background: black;
  color: white;
}
```

for more styling options take a look at the default stylesheet
