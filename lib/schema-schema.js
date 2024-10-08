// @ts-nocheck
export var KindBool;
(function (KindBool) {
    function isKindBool(value) {
        return typeof value === 'boolean';
    }
    KindBool.isKindBool = isKindBool;
})(KindBool || (KindBool = {}));
export var KindString;
(function (KindString) {
    function isKindString(value) {
        return typeof value === 'string';
    }
    KindString.isKindString = isKindString;
})(KindString || (KindString = {}));
export var KindBytes;
(function (KindBytes) {
    function isKindBytes(value) {
        return value instanceof Uint8Array;
    }
    KindBytes.isKindBytes = isKindBytes;
})(KindBytes || (KindBytes = {}));
export var KindInt;
(function (KindInt) {
    function isKindInt(value) {
        return typeof value === 'number' && Number.isInteger(value) && Number.isFinite(value);
    }
    KindInt.isKindInt = isKindInt;
})(KindInt || (KindInt = {}));
export var KindFloat;
(function (KindFloat) {
    function isKindFloat(value) {
        return typeof value === 'number' && Number.isFinite(value);
    }
    KindFloat.isKindFloat = isKindFloat;
})(KindFloat || (KindFloat = {}));
export var KindNull;
(function (KindNull) {
    function isKindNull(value) {
        return value === null;
    }
    KindNull.isKindNull = isKindNull;
})(KindNull || (KindNull = {}));
export var KindMap;
(function (KindMap) {
    function isKindMap(value) {
        return value !== null && typeof value === 'object' && value.asCID !== value && !Array.isArray(value) && !(value instanceof Uint8Array);
    }
    KindMap.isKindMap = isKindMap;
})(KindMap || (KindMap = {}));
export var KindList;
(function (KindList) {
    function isKindList(value) {
        return Array.isArray(value);
    }
    KindList.isKindList = isKindList;
})(KindList || (KindList = {}));
export var KindLink;
(function (KindLink) {
    function isKindLink(value) {
        return value !== null && typeof value === 'object' && value.asCID === value;
    }
    KindLink.isKindLink = isKindLink;
})(KindLink || (KindLink = {}));
