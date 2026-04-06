// 笔记分类枚举
export var NoteCategory;
(function (NoteCategory) {
    NoteCategory["WORK"] = "work";
    NoteCategory["STUDY"] = "study";
    NoteCategory["CREATIVE"] = "creative";
    NoteCategory["PERSONAL"] = "personal";
    NoteCategory["AI_GENERATED"] = "ai-generated";
})(NoteCategory || (NoteCategory = {}));
// AI操作类型
export var AIOperation;
(function (AIOperation) {
    AIOperation["SUMMARIZE"] = "summarize";
    AIOperation["POLISH"] = "polish";
    AIOperation["TRANSLATE"] = "translate";
    AIOperation["SUGGEST"] = "suggest";
    AIOperation["CHAT"] = "chat";
})(AIOperation || (AIOperation = {}));
//# sourceMappingURL=types.js.map