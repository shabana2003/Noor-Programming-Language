const Types = {
    NUMBER: "NUMBER",
    TEXT: "TEXT",
    BOOLEAN: "BOOLEAN",
    NOTHING: "NOTHING"
};

function isValidType(type) {
    return Object.values(Types).includes(type);
}

function typesMatch(typeA, typeB) {
    return typeA === typeB;
}

module.exports = {
    Types,
    isValidType,
    typesMatch
};
