export type Puzzle = {
    startNode: NodeId;
    nodes: {
        [nodeId: NodeId]: Node;
    };
};

export type Flag = {
    type: 'global' | 'local';
    key: string;
};

export type NodeId = string;

export type Node =
    | NodeHtml
    | NodeTextInput
    | NodeOptionInput
    | NodeClickImageInput
    | NodeGoto
    | NodeSetFlag
    | NodeCheckFlag
    | NodePenaltyKickToStart
    | NodeSetCompletedFlag;

export type NodeHtml = {
    type: 'html';
    content: string;
    goto?: NodeId;
};

export type NodeTextInput = {
    type: 'text-input';
    prompt?: string;
    responses: TextInputResponse[];
    fallthroughResponse: string;
};

export type TextInputResponse = {
    check: TextInputResponseCheck;
    action: TextInputResponseAction;
};

export type TextInputResponseCheck =
    | TextInputResponseCheckString
    | TextInputResponseCheckRegex;

export type TextInputResponseCheckString = {
    type: 'string';
    string: string;
    isCaseSensitive?: boolean;
};

export type TextInputResponseCheckRegex = {
    type: 'regex';
    regex: string;
    regexFlags?: string;
};

export type TextInputResponseAction =
    | TextInputResponseActionMessage
    | TextInputResponseActionGoto;

export type TextInputResponseActionMessage = {
    type: 'message';
    message: string;
};

export type TextInputResponseActionGoto = {
    type: 'goto';
    goto: NodeId;
};

export type NodeOptionInput = {
    type: 'option-input';
    options: NodeOptionInputOption[];
    fallthroughGoto?: NodeId; // if no more options (due to flags), goto the specified node. Can be undefined, in which case the flow ends
};

export type NodeOptionInputOption = {
    label: string;
    goto: NodeId;
    showFlag?: Flag; // if specified, this option will only appear if the flag has been set
    oneUseFlag?: Flag; // if specified, this option will only appear if the flag hasn't already been set. Upon visiting, hides the flag. Higher precedence than showFlag
};

export type NodeClickImageInput = {
    type: 'click-image-input';
    prompt: string;
    image: string;
    clickMap: string;
    clickActions: { [color: string]: NodeClickImageInputAction };
    fallthroughResponse: string;
};

export type NodeClickImageInputAction =
    | NodeClickImageInputActionMessage
    | NodeClickImageInputActionGoto;

export type NodeClickImageInputActionMessage = {
    type: 'message';
    message: string;
};

export type NodeClickImageInputActionGoto = {
    type: 'goto';
    goto: NodeId;
};

export type NodeGoto = {
    type: 'goto';
    goto: NodeId;
};

export type NodeSetFlag = {
    type: 'set-flag';
    flag: Flag;
    value?: boolean; // defaults to true
    goto: NodeId;
};

export type NodeCheckFlag = {
    type: 'check-flag';
    flag: Flag;
    gotoIfTrue: NodeId;
    gotoIfFalse: NodeId;
};

export type NodePenaltyKickToStart = {
    type: 'penalty-kick-to-start';
    content: string;
    delay: number;
};

export type NodeSetCompletedFlag = {
    type: 'set-completed-flag';
    goto?: NodeId;
};

export type UserResponse =
    | UserResponseText
    | UserResponseOption
    | UserResponseClickImage;

export type UserResponseText = {
    type: 'text';
    value: string;
    isEnter: boolean; // true if the user has entered the answer
} & UserResponseBase;

export type UserResponseOption = {
    type: 'option';
    value: number;
} & UserResponseBase;

export type UserResponseClickImage = {
    type: 'click-image';
    clickX: number;
    clickY: number;
} & UserResponseBase;

export type UserResponseBase = {
    type: string;
    nodeIndex: number; // Node index refers to the index of the flow, not the node id
};

export type PuzzleState = {
    _nextStateUid: number;
    nodeStates: NodeState[];
};

export type NodeState = {
    _uid: number;
    nodeId: string;

    localData: LocalData;
    nodeData: NodeData;
};

export type LocalData = {
    flags: {
        [flag: string]: boolean;
    };
};

export type NodeData =
    | NodeDataHtml
    | NodeDataTextInput
    | NodeDataOptionInput
    | NodeDataClickImageInput
    | NodeDataPenaltyKickToStart;

export type NodeDataHtml = {};

export type NodeDataTextInput = {
    value: string;
    response?: string;
};

export type NodeDataOptionInput = {
    value: undefined | number;
};

export type NodeDataClickImageInput = {
    clickX: number;
    clickY: number;
    response?: string;
};

export type NodeDataPenaltyKickToStart = {
    timeStart: number;
}

export type PuzzlePenalty = PuzzlePenaltyKickToStart;

export type PuzzlePenaltyKickToStart = {
    type: 'kick-to-start';
    content: string;
    timeEnd: number;
};