function identity(source) {
    const options = this.getOptions();
    console.log(options, source);
    return source;
}

module.exports = identity;
