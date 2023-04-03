# Story Puzzle Format

## Story

JSON files in `src/puzzle/data.dev/` and `src/puzzle/data.prod` takes the following structure:

```typescript
{
    [code: string]: Puzzle
}
```

-   `code` is the 6-letter code required to access the corresponding [Puzzle](#puzzle). Multiple puzzles can be stored in a single JSON files, and multiple JSON files can be used in each `src/puzzle/data.*` folder.

## Puzzle

A puzzle represents a self-contained story chapter. It takes the following structure:

```typescript
{
    startNode: NodeId;
    nodes: {
        [nodeId: NodeId]: Node;
    };
};
```

-   `startNode` is the ID of the first node to start rendering from.

## Flag

Throughout the game, flags may be set to `true` or `false` and used to control various paths or show/hide dialogue options. They take the following structure:

```
{
    type: 'global' | 'local';
    key: string;
}
```

- A `type` of `global` will store the true/false value across different `Puzzle`s. This is persistently stored in the browser `localStorage`.
- A `type` of `local` will store the true/false value within the current `Puzzle`. Note that if this value is set at a certain node, it will be undone if the user backtracks before this node.
- `key` is a unique identifier to represent this flag.

A flag value is set to `false` by default.

## NodeId

`NodeId` is a string representing a [node](#node).

## Node

A node can be one of the following types:

- [Story Puzzle Format](#story-puzzle-format)
  - [Story](#story)
  - [Puzzle](#puzzle)
  - [Flag](#flag)
  - [NodeId](#nodeid)
  - [Node](#node)
  - [NodeHtml](#nodehtml)
  - [NodeTextInput](#nodetextinput)
    - [TextInputResponse](#textinputresponse)
      - [TextInputResponseCheck](#textinputresponsecheck)
      - [TextInputResponseAction](#textinputresponseaction)
  - [NodeOptionInput](#nodeoptioninput)
    - [NodeOptionInputOption](#nodeoptioninputoption)
  - [NodeClickImageInput](#nodeclickimageinput)
    - [NodeClickImageInputAction](#nodeclickimageinputaction)
  - [NodeGoto](#nodegoto)
  - [NodeSetFlag](#nodesetflag)
  - [NodeCheckFlag](#nodecheckflag)
  - [NodePenaltyKickToStart](#nodepenaltykicktostart)

## NodeHtml

A `NodeHtml` node represents a section of HTML to render. `<img>` and `<video>` elements can be used too. Put the source file in the `src/puzzle/assets.dev` or `src/puzzle/assets.prod` folder and refer to them by file name. E.g. `<img src="image.png">`.

It takes the following structure:

```typescript
{
    type: 'html';
    content: string;
    goto?: NodeId;
}
```

-   `content` is the HTML string to render.
-   `goto` is an optional [NodeId](#nodeid). If this is specified, the next node automatically renders. Otherwise, the player reaches a “dead end”. Note that the player can still go to earlier nodes and interact with them.

## NodeTextInput

A `NodeTextInput` node will render an input box that accepts text. It takes the following structure:

```typescript
{
    type: 'text-input';
    prompt?: string;
    responses: TextInputResponse[];
    fallthroughResponse: string;
}
```

-   `prompt` is a HTML string to be rendered above the text input.
-   `responses` is an array of [TextInputResponse](#textinputresponse)s to check the inputs with. These responses are validated from top down, and the first match gets activated.
-   `fallthroughResponse` is a HTML string to be rendered when none of the `responses` match the player input in the text input.

For instance, if node take the following form:

```json
{
    "type": "text-input",
    "prompt": "Enter a passcode",
    "responses": [
        {
            "check": {
                "type": "string",
                "string": "PassWord",
                "isCaseSensitive": true
            },
            "action": {
                "type": "goto",
                "goto": "correct-node"
            }
        },
        {
            "check": {
                "type": "string",
                "string": "PassWord",
                "isCaseSensitive": false
            },
            "action": {
                "type": "message",
                "message": "Note that the password is case sensitive!"
            }
        },
        {
            "check": {
                "type": "regex",
                "regex": "^.{0,5}$"
            },
            "action": {
                "type": "message",
                "message": "Please enter at least 6 characters."
            }
        }
    ],
    "fallthroughResponse": "Incorrect password"
}
```

A text input is rendered with the prompt "Enter a passcode".

-   If the player enters anything below 6 characters long, it matches the 3rd `TextInputResponse` in the array, and the message “Please enter at least 6 characters.” is printed.
-   If the player enters “Password” in any case other than “PassWord”, then it matches the 2nd `TextInputResponse` in the array, and the message “Note that the password is case sensitive!” is printed.
-   If the player enters “PassWord”, it matches the first and second `TextInputResponse` in the array, but only the first response is active, and the node `correct-node` is rendered below.
-   Any other response prints the Incorrect password” message.

### TextInputResponse

`TextInputResponse` is a check for a specific type of text input, as well as the resulting action to take should the user input match. It takes the following structure:

```typescript
{
    check: TextInputResponseCheck;
    action: TextInputResponseAction;
}
```

-   [TextInputResponseCheck](#textinputresponsecheck) is a conditional for which the user input is to be checked against.
-   [TextInputResponseAction](#textinputresponseaction) is an action to be taken should the conditional match.

#### TextInputResponseCheck

`TextInputResponseCheck` takes one of the follow structures:

**String check**

```typescript
{
    type: 'string';
    string: string;
    isCaseSensitive?: boolean;
}
```

-   `string` is the string to check the user input against
-   `isCaseSensitive` is a boolean to indicate if the string comparison should be case sensitive. Defaults to `false`.

**Regex check**

```typescript
{
    type: 'regex';
    regex: string;
    regexFlags?: string;
}
```

-   `regex` is the regex to check the user input against
-   `regexFlags` is the flags to initialise `regex` with.

#### TextInputResponseAction

`TextInputResponseAction` takes one of the follow structures:

**Message**

```typescript
{
    type: 'message';
    message: string;
}
```

-   `message` is the HTML string to print.

**Goto**

```typescript
{
    type: 'goto';
    goto: NodeId;
}
```

-   `goto` is the ID of the next node to render.

## NodeOptionInput

A `NodeOptionInput` node will render a list of options that the player can select. It takes on the following structure:

```typescript
{
    type: 'option-input';
    options: NodeOptionInputOption[];
    fallthroughGoto?: NodeId;
}
```

- `options` is an array of [NodeOptionInputOption](#nodeoptioninputoption)s to be rendered.
- `fallthroughGoto`: if no available options, render the node specified by this node ID. If this is `undefined` and no available options are left, then the flow ends.

### NodeOptionInputOption

A `NodeOptionInputOption` represents a selectable option in [NodeOptionInput](#nodeoptioninput). It takes the following structure:

```typescript
{
    label: string;
    goto: NodeId;
    showFlag?: Flag;
    oneUseFlag?: Flag;
}
```

- `label` is the HTML string to render on the option.
- `goto` is the ID of the node to render next when this option is selected.
- `showFlag`: if `undefined`, the option will always be available. If specified and the flag’s value is set to `true`, then this option will be available. Otherwise, it will be hidden.
- `oneUseFlag`: if specified, this option will only appear if the flag is set to `false`. Upon visiting, the flag is set to `true`. Higher precedence than `showFlag`.

## NodeClickImageInput

A `NodeClickImageInput` node will render an image that the player can click on. It takes the following structure:

```typescript
{
    type: 'click-image-input';
    prompt: string;
    image: string;
    clickMap: string;
    clickActions: { [color: string]: NodeClickImageInputAction };
    fallthroughResponse: string;
}
```

-   `prompt` is a HTML string to be rendered above the image.
-   `image` is the filename of the image in the `/src/puzzle/assets.*` folder.
-   `clickMap` is the filename of the click map in the `/src/puzzle/assets.*` folder. It should have a `.inline.*` extension, e.g. `.inline.png` extension so that it is inlined during the build process. Otherwise, the engine will face security errors when trying to run this game locally.
-   `responses` is an array of [TextInputResponse](#textinputresponse)s to check the inputs with. These responses are validated from top down, and the first match gets activated.
-   `fallthroughResponse` is a HTML string to be rendered when none of the `clickActions` match the player input.

**Click Map**

A click map is an image with the same dimensions as the rendered image for the player to click on. When the user clicks on the original image, the same pixel is checked on the click map. Let’s call the color of this pixel `c`. If `c` is in `clickActions`, then the corresponding [NodeClickImageInputAction](#nodeclickimageinputaction) is activated. Otherwise, the `fallthroughResponse` message is displayed instead.

### NodeClickImageInputAction

`NodeClickImageInputAction` takes one of the follow structures:

**Message**

```typescript
{
    type: 'message';
    message: string;
}
```

-   `message` is the HTML string to print.

**Goto**

```typescript
{
    type: 'goto';
    goto: NodeId;
}
```

-   `goto` is the ID of the next node to render.

## NodeGoto

When a `NodeGoto` node is reached, nothing new is rendered. The corresponding flag is set to `true` or `false`, and the next node is rendered. It takes the following structure:

```typescript
{
    type: 'goto';
    goto: NodeId;
}
```

- `goto` is the ID of the next node to render.

## NodeSetFlag

When a `NodeSetFlag` node is reached, nothing new is rendered. The corresponding flag is set to `true` or `false`, and the next node is rendered. It takes the following structure:

```typescript
{
    type: 'set-flag';
    flag: Flag;
    value?: boolean;
    goto: NodeId;
}
```

- `flag` is the [Flag](#flag) to set.
- `value` is the new value of the flag. Defaults to `true`.
- `goto` is the ID of the node to render next.

Note that if a player changes their input at an earlier node, this node will be “undone” and the value of the flag will go back to what it originally was.

## NodeCheckFlag

When a `NodeCheckFlag` node is reached, nothing new is rendered. The next node rendered depends on whether the `flag` value is true or false. It takes the following structure:

```typescript
{
    type: 'check-flag';
    flag: Flag;
    gotoIfTrue: NodeId;
    gotoIfFalse: NodeId;
}
```

- `flag` is the [Flag](#flag) to check.
- `gotoIfTrue` is the ID of the node to render next if `flag` is set to true.
- `gotoIfFalse` is the ID of the node to render next if `flag` is set to false.

## NodePenaltyKickToStart

When a `NodePenaltyKickToStart` node is reached, the player is immediately shown a message and kicked to the code-entry screen after a set amount of time. It takes the following structure:

```typescript
{
    type: 'penalty-kick-to-start';
    content: string;
    delay: number;
}
```

- `content` is the HTML string to render.
- `delay` is the time (in milliseconds) to display the message before kicking the player to the code-entry screen.

