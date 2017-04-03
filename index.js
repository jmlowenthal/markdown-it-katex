/* Process inline math */
/*
Like markdown-it-simplemath, this is a stripped down, simplified version of:
https://github.com/runarberg/markdown-it-math

It differs in that it takes (a subset of) LaTeX as input and relies on KaTeX
for rendering output.
*/

/*jslint node: true */
'use strict';

var katex = require('katex');

function math_inline(state, silent) {
    var start, match, token, res, pos, esc_count;

    if (state.src[state.pos] !== "\\" || state.src[state.pos + 1] !== "(") {
    	return false;
    }

    pos = state.pos - 1;
    while (state.src[pos] === "\\") { pos -= 1; }
    if ( ((match - pos) % 2) == 1 ) { return false; }

    start = state.pos + 1;
    match = start;
    while ( (match = state.src.indexOf(")", match)) !== -1) {
        pos = match - 1;
        while (state.src[pos] === "\\") { pos -= 1; }

        // Even number of escapes, potential closing delimiter found
        if ( ((match - pos) % 2) == 0 ) { break; }
        match += 1;
    }

    // No closing delimter found
    if (match === -1) {
        if (!silent) { state.pending += "("; }
        state.pos = start;
        return true;
    }

    if (!silent) {
        token         = state.push('math_inline', 'math', 0);
        token.markup  = "\\(";
        token.content = state.src.slice(start + 1, match - 1);
    }

    state.pos = match + 1;
    return true;
}

function math_display(state, silent) {
    var start, match, token, res, pos, esc_count;

    if (state.src[state.pos] !== "\\" || state.src[state.pos + 1] !== "[") {
    	return false;
    }

    pos = state.pos - 1;
    while (state.src[pos] === "\\") { pos -= 1; }
    if ( ((match - pos) % 2) == 1 ) { return false; }

    start = state.pos + 1;
    match = start;
    while ( (match = state.src.indexOf("]", match)) !== -1) {
        pos = match - 1;
        while (state.src[pos] === "\\") { pos -= 1; }

        // Even number of escapes, potential closing delimiter found
        if ( ((match - pos) % 2) == 0 ) { break; }
        match += 1;
    }

    // No closing delimter found
    if (match === -1) {
        if (!silent) { state.pending += "["; }
        state.pos = start;
        return true;
    }

    if (!silent) {
        token         = state.push('math_display', 'math', 0);
        token.markup  = "\\[";
        token.content = state.src.slice(start + 1, match - 1);
    }

    state.pos = match + 1;
    return true;
}

module.exports = function math_plugin(md, options) {
    options = options || {};

    var katexInline = function(latex){
        options.displayMode = false;
        try{
            return katex.renderToString(latex, options);
        }
        catch(error){
            if(options.throwOnError){ console.log(error); }
            return latex;
        }
    };

    var inlineRenderer = function(tokens, idx){
        return katexInline(tokens[idx].content);
    };

    var katexDisplay = function(latex){
        options.displayMode = true;
        try{
            return katex.renderToString(latex, options);
        }
        catch(error){
            if(options.throwOnError){ console.log(error); }
            return latex;
        }
    }

    var displayRenderer = function(tokens, idx){
        return  katexDisplay(tokens[idx].content);
    }

    md.inline.ruler.before('escape', 'math_inline', math_inline);
    md.inline.ruler.before('escape', 'math_display', math_display);
    md.renderer.rules.math_inline = inlineRenderer;
    md.renderer.rules.math_display = displayRenderer;
};
