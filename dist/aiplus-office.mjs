#!/usr/bin/env node
import { createRequire as __officeRequire } from "node:module";
const require = __officeRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS({
  "node_modules/yaml/dist/nodes/identity.js"(exports) {
    "use strict";
    var ALIAS = Symbol.for("yaml.alias");
    var DOC = Symbol.for("yaml.document");
    var MAP = Symbol.for("yaml.map");
    var PAIR = Symbol.for("yaml.pair");
    var SCALAR = Symbol.for("yaml.scalar");
    var SEQ = Symbol.for("yaml.seq");
    var NODE_TYPE = Symbol.for("yaml.node.type");
    var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
    var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
    var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
    var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
    var isScalar2 = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
    var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
    function isCollection(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case MAP:
          case SEQ:
            return true;
        }
      return false;
    }
    function isNode(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case ALIAS:
          case MAP:
          case SCALAR:
          case SEQ:
            return true;
        }
      return false;
    }
    var hasAnchor = (node) => (isScalar2(node) || isCollection(node)) && !!node.anchor;
    exports.ALIAS = ALIAS;
    exports.DOC = DOC;
    exports.MAP = MAP;
    exports.NODE_TYPE = NODE_TYPE;
    exports.PAIR = PAIR;
    exports.SCALAR = SCALAR;
    exports.SEQ = SEQ;
    exports.hasAnchor = hasAnchor;
    exports.isAlias = isAlias;
    exports.isCollection = isCollection;
    exports.isDocument = isDocument;
    exports.isMap = isMap;
    exports.isNode = isNode;
    exports.isPair = isPair;
    exports.isScalar = isScalar2;
    exports.isSeq = isSeq;
  }
});

// node_modules/yaml/dist/visit.js
var require_visit = __commonJS({
  "node_modules/yaml/dist/visit.js"(exports) {
    "use strict";
    var identity = require_identity();
    var BREAK = Symbol("break visit");
    var SKIP = Symbol("skip children");
    var REMOVE = Symbol("remove node");
    function visit(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        visit_(null, node, visitor_, Object.freeze([]));
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    function visit_(key, node, visitor, path11) {
      const ctrl = callVisitor(key, node, visitor, path11);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path11, ctrl);
        return visit_(key, ctrl, visitor, path11);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path11 = Object.freeze(path11.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = visit_(i, node.items[i], visitor, path11);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path11 = Object.freeze(path11.concat(node));
          const ck = visit_("key", node.key, visitor, path11);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = visit_("value", node.value, visitor, path11);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    async function visitAsync(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        await visitAsync_(null, node, visitor_, Object.freeze([]));
    }
    visitAsync.BREAK = BREAK;
    visitAsync.SKIP = SKIP;
    visitAsync.REMOVE = REMOVE;
    async function visitAsync_(key, node, visitor, path11) {
      const ctrl = await callVisitor(key, node, visitor, path11);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path11, ctrl);
        return visitAsync_(key, ctrl, visitor, path11);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path11 = Object.freeze(path11.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = await visitAsync_(i, node.items[i], visitor, path11);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path11 = Object.freeze(path11.concat(node));
          const ck = await visitAsync_("key", node.key, visitor, path11);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = await visitAsync_("value", node.value, visitor, path11);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    function initVisitor(visitor) {
      if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
        return Object.assign({
          Alias: visitor.Node,
          Map: visitor.Node,
          Scalar: visitor.Node,
          Seq: visitor.Node
        }, visitor.Value && {
          Map: visitor.Value,
          Scalar: visitor.Value,
          Seq: visitor.Value
        }, visitor.Collection && {
          Map: visitor.Collection,
          Seq: visitor.Collection
        }, visitor);
      }
      return visitor;
    }
    function callVisitor(key, node, visitor, path11) {
      if (typeof visitor === "function")
        return visitor(key, node, path11);
      if (identity.isMap(node))
        return visitor.Map?.(key, node, path11);
      if (identity.isSeq(node))
        return visitor.Seq?.(key, node, path11);
      if (identity.isPair(node))
        return visitor.Pair?.(key, node, path11);
      if (identity.isScalar(node))
        return visitor.Scalar?.(key, node, path11);
      if (identity.isAlias(node))
        return visitor.Alias?.(key, node, path11);
      return void 0;
    }
    function replaceNode(key, path11, node) {
      const parent = path11[path11.length - 1];
      if (identity.isCollection(parent)) {
        parent.items[key] = node;
      } else if (identity.isPair(parent)) {
        if (key === "key")
          parent.key = node;
        else
          parent.value = node;
      } else if (identity.isDocument(parent)) {
        parent.contents = node;
      } else {
        const pt = identity.isAlias(parent) ? "alias" : "scalar";
        throw new Error(`Cannot replace node with ${pt} parent`);
      }
    }
    exports.visit = visit;
    exports.visitAsync = visitAsync;
  }
});

// node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS({
  "node_modules/yaml/dist/doc/directives.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    var escapeChars = {
      "!": "%21",
      ",": "%2C",
      "[": "%5B",
      "]": "%5D",
      "{": "%7B",
      "}": "%7D"
    };
    var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
    var Directives = class _Directives {
      constructor(yaml, tags) {
        this.docStart = null;
        this.docEnd = false;
        this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
        this.tags = Object.assign({}, _Directives.defaultTags, tags);
      }
      clone() {
        const copy = new _Directives(this.yaml, this.tags);
        copy.docStart = this.docStart;
        return copy;
      }
      /**
       * During parsing, get a Directives instance for the current document and
       * update the stream state according to the current version's spec.
       */
      atDocument() {
        const res = new _Directives(this.yaml, this.tags);
        switch (this.yaml.version) {
          case "1.1":
            this.atNextDocument = true;
            break;
          case "1.2":
            this.atNextDocument = false;
            this.yaml = {
              explicit: _Directives.defaultYaml.explicit,
              version: "1.2"
            };
            this.tags = Object.assign({}, _Directives.defaultTags);
            break;
        }
        return res;
      }
      /**
       * @param onError - May be called even if the action was successful
       * @returns `true` on success
       */
      add(line, onError) {
        if (this.atNextDocument) {
          this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
          this.tags = Object.assign({}, _Directives.defaultTags);
          this.atNextDocument = false;
        }
        const parts = line.trim().split(/[ \t]+/);
        const name = parts.shift();
        switch (name) {
          case "%TAG": {
            if (parts.length !== 2) {
              onError(0, "%TAG directive should contain exactly two parts");
              if (parts.length < 2)
                return false;
            }
            const [handle, prefix] = parts;
            this.tags[handle] = prefix;
            return true;
          }
          case "%YAML": {
            this.yaml.explicit = true;
            if (parts.length !== 1) {
              onError(0, "%YAML directive should contain exactly one part");
              return false;
            }
            const [version] = parts;
            if (version === "1.1" || version === "1.2") {
              this.yaml.version = version;
              return true;
            } else {
              const isValid = /^\d+\.\d+$/.test(version);
              onError(6, `Unsupported YAML version ${version}`, isValid);
              return false;
            }
          }
          default:
            onError(0, `Unknown directive ${name}`, true);
            return false;
        }
      }
      /**
       * Resolves a tag, matching handles to those defined in %TAG directives.
       *
       * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
       *   `'!local'` tag, or `null` if unresolvable.
       */
      tagName(source, onError) {
        if (source === "!")
          return "!";
        if (source[0] !== "!") {
          onError(`Not a valid tag: ${source}`);
          return null;
        }
        if (source[1] === "<") {
          const verbatim = source.slice(2, -1);
          if (verbatim === "!" || verbatim === "!!") {
            onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
            return null;
          }
          if (source[source.length - 1] !== ">")
            onError("Verbatim tags must end with a >");
          return verbatim;
        }
        const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
        if (!suffix)
          onError(`The ${source} tag has no suffix`);
        const prefix = this.tags[handle];
        if (prefix) {
          try {
            return prefix + decodeURIComponent(suffix);
          } catch (error) {
            onError(String(error));
            return null;
          }
        }
        if (handle === "!")
          return source;
        onError(`Could not resolve tag: ${source}`);
        return null;
      }
      /**
       * Given a fully resolved tag, returns its printable string form,
       * taking into account current tag prefixes and defaults.
       */
      tagString(tag) {
        for (const [handle, prefix] of Object.entries(this.tags)) {
          if (tag.startsWith(prefix))
            return handle + escapeTagName(tag.substring(prefix.length));
        }
        return tag[0] === "!" ? tag : `!<${tag}>`;
      }
      toString(doc) {
        const lines2 = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
        const tagEntries = Object.entries(this.tags);
        let tagNames;
        if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
          const tags = {};
          visit.visit(doc.contents, (_key, node) => {
            if (identity.isNode(node) && node.tag)
              tags[node.tag] = true;
          });
          tagNames = Object.keys(tags);
        } else
          tagNames = [];
        for (const [handle, prefix] of tagEntries) {
          if (handle === "!!" && prefix === "tag:yaml.org,2002:")
            continue;
          if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
            lines2.push(`%TAG ${handle} ${prefix}`);
        }
        return lines2.join("\n");
      }
    };
    Directives.defaultYaml = { explicit: false, version: "1.2" };
    Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
    exports.Directives = Directives;
  }
});

// node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS({
  "node_modules/yaml/dist/doc/anchors.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    function anchorIsValid(anchor) {
      if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
        const sa = JSON.stringify(anchor);
        const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
        throw new Error(msg);
      }
      return true;
    }
    function anchorNames(root) {
      const anchors = /* @__PURE__ */ new Set();
      visit.visit(root, {
        Value(_key, node) {
          if (node.anchor)
            anchors.add(node.anchor);
        }
      });
      return anchors;
    }
    function findNewAnchor(prefix, exclude) {
      for (let i = 1; true; ++i) {
        const name = `${prefix}${i}`;
        if (!exclude.has(name))
          return name;
      }
    }
    function createNodeAnchors(doc, prefix) {
      const aliasObjects = [];
      const sourceObjects = /* @__PURE__ */ new Map();
      let prevAnchors = null;
      return {
        onAnchor: (source) => {
          aliasObjects.push(source);
          prevAnchors ?? (prevAnchors = anchorNames(doc));
          const anchor = findNewAnchor(prefix, prevAnchors);
          prevAnchors.add(anchor);
          return anchor;
        },
        /**
         * With circular references, the source node is only resolved after all
         * of its child nodes are. This is why anchors are set only after all of
         * the nodes have been created.
         */
        setAnchors: () => {
          for (const source of aliasObjects) {
            const ref = sourceObjects.get(source);
            if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
              ref.node.anchor = ref.anchor;
            } else {
              const error = new Error("Failed to resolve repeated object (this should not happen)");
              error.source = source;
              throw error;
            }
          }
        },
        sourceObjects
      };
    }
    exports.anchorIsValid = anchorIsValid;
    exports.anchorNames = anchorNames;
    exports.createNodeAnchors = createNodeAnchors;
    exports.findNewAnchor = findNewAnchor;
  }
});

// node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS({
  "node_modules/yaml/dist/doc/applyReviver.js"(exports) {
    "use strict";
    function applyReviver(reviver, obj, key, val) {
      if (val && typeof val === "object") {
        if (Array.isArray(val)) {
          for (let i = 0, len = val.length; i < len; ++i) {
            const v0 = val[i];
            const v1 = applyReviver(reviver, val, String(i), v0);
            if (v1 === void 0)
              delete val[i];
            else if (v1 !== v0)
              val[i] = v1;
          }
        } else if (val instanceof Map) {
          for (const k of Array.from(val.keys())) {
            const v0 = val.get(k);
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              val.delete(k);
            else if (v1 !== v0)
              val.set(k, v1);
          }
        } else if (val instanceof Set) {
          for (const v0 of Array.from(val)) {
            const v1 = applyReviver(reviver, val, v0, v0);
            if (v1 === void 0)
              val.delete(v0);
            else if (v1 !== v0) {
              val.delete(v0);
              val.add(v1);
            }
          }
        } else {
          for (const [k, v0] of Object.entries(val)) {
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              delete val[k];
            else if (v1 !== v0)
              val[k] = v1;
          }
        }
      }
      return reviver.call(obj, key, val);
    }
    exports.applyReviver = applyReviver;
  }
});

// node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS({
  "node_modules/yaml/dist/nodes/toJS.js"(exports) {
    "use strict";
    var identity = require_identity();
    function toJS(value, arg, ctx) {
      if (Array.isArray(value))
        return value.map((v, i) => toJS(v, String(i), ctx));
      if (value && typeof value.toJSON === "function") {
        if (!ctx || !identity.hasAnchor(value))
          return value.toJSON(arg, ctx);
        const data = { aliasCount: 0, count: 1, res: void 0 };
        ctx.anchors.set(value, data);
        ctx.onCreate = (res2) => {
          data.res = res2;
          delete ctx.onCreate;
        };
        const res = value.toJSON(arg, ctx);
        if (ctx.onCreate)
          ctx.onCreate(res);
        return res;
      }
      if (typeof value === "bigint" && !ctx?.keep)
        return Number(value);
      return value;
    }
    exports.toJS = toJS;
  }
});

// node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS({
  "node_modules/yaml/dist/nodes/Node.js"(exports) {
    "use strict";
    var applyReviver = require_applyReviver();
    var identity = require_identity();
    var toJS = require_toJS();
    var NodeBase = class {
      constructor(type) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: type });
      }
      /** Create a copy of this node.  */
      clone() {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** A plain JavaScript representation of this node. */
      toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        if (!identity.isDocument(doc))
          throw new TypeError("A document argument is required");
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc,
          keep: true,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this, "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
    };
    exports.NodeBase = NodeBase;
  }
});

// node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS({
  "node_modules/yaml/dist/nodes/Alias.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var visit = require_visit();
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var Alias = class extends Node.NodeBase {
      constructor(source) {
        super(identity.ALIAS);
        this.source = source;
        Object.defineProperty(this, "tag", {
          set() {
            throw new Error("Alias nodes cannot have tags");
          }
        });
      }
      /**
       * Resolve the value of this alias within `doc`, finding the last
       * instance of the `source` anchor before this node.
       */
      resolve(doc, ctx) {
        if (ctx?.maxAliasCount === 0)
          throw new ReferenceError("Alias resolution is disabled");
        let nodes;
        if (ctx?.aliasResolveCache) {
          nodes = ctx.aliasResolveCache;
        } else {
          nodes = [];
          visit.visit(doc, {
            Node: (_key, node) => {
              if (identity.isAlias(node) || identity.hasAnchor(node))
                nodes.push(node);
            }
          });
          if (ctx)
            ctx.aliasResolveCache = nodes;
        }
        let found = void 0;
        for (const node of nodes) {
          if (node === this)
            break;
          if (node.anchor === this.source)
            found = node;
        }
        if (found && ctx) {
          const { anchors: anchors2, doc: doc2, maxAliasCount } = ctx;
          let data = anchors2.get(found);
          if (!data) {
            toJS.toJS(found, null, ctx);
            data = anchors2.get(found);
          }
          if (data?.res === void 0) {
            const msg = "This should not happen: Alias anchor was not resolved?";
            throw new ReferenceError(msg);
          }
          if (maxAliasCount >= 0) {
            data.count += 1;
            if (data.aliasCount === 0)
              data.aliasCount = getAliasCount(doc2, found, anchors2);
            if (data.count * data.aliasCount > maxAliasCount) {
              const msg = "Excessive alias count indicates a resource exhaustion attack";
              throw new ReferenceError(msg);
            }
          }
        }
        return found;
      }
      toJSON(_arg, ctx) {
        if (!ctx)
          return { source: this.source };
        const source = this.resolve(ctx.doc, ctx);
        if (!source) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new ReferenceError(msg);
        }
        return ctx.anchors.get(source).res;
      }
      toString(ctx, _onComment, _onChompKeep) {
        const src = `*${this.source}`;
        if (ctx) {
          anchors.anchorIsValid(this.source);
          if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
            throw new Error(msg);
          }
          if (ctx.implicitKey)
            return `${src} `;
        }
        return src;
      }
    };
    function getAliasCount(doc, node, anchors2) {
      if (identity.isAlias(node)) {
        const source = node.resolve(doc);
        const anchor = anchors2 && source && anchors2.get(source);
        return anchor ? anchor.count * anchor.aliasCount : 0;
      } else if (identity.isCollection(node)) {
        let count = 0;
        for (const item of node.items) {
          const c = getAliasCount(doc, item, anchors2);
          if (c > count)
            count = c;
        }
        return count;
      } else if (identity.isPair(node)) {
        const kc = getAliasCount(doc, node.key, anchors2);
        const vc = getAliasCount(doc, node.value, anchors2);
        return Math.max(kc, vc);
      }
      return 1;
    }
    exports.Alias = Alias;
  }
});

// node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS({
  "node_modules/yaml/dist/nodes/Scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
    var Scalar = class extends Node.NodeBase {
      constructor(value) {
        super(identity.SCALAR);
        this.value = value;
      }
      toJSON(arg, ctx) {
        return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
      }
      toString() {
        return String(this.value);
      }
    };
    Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
    Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
    Scalar.PLAIN = "PLAIN";
    Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
    Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
    exports.Scalar = Scalar;
    exports.isScalarValue = isScalarValue;
  }
});

// node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS({
  "node_modules/yaml/dist/doc/createNode.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var defaultTagPrefix = "tag:yaml.org,2002:";
    function findTagObject(value, tagName, tags) {
      if (tagName) {
        const match = tags.filter((t) => t.tag === tagName);
        const tagObj = match.find((t) => !t.format) ?? match[0];
        if (!tagObj)
          throw new Error(`Tag ${tagName} not found`);
        return tagObj;
      }
      return tags.find((t) => t.identify?.(value) && !t.format);
    }
    function createNode(value, tagName, ctx) {
      if (identity.isDocument(value))
        value = value.contents;
      if (identity.isNode(value))
        return value;
      if (identity.isPair(value)) {
        const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
        map.items.push(value);
        return map;
      }
      if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
        value = value.valueOf();
      }
      const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
      let ref = void 0;
      if (aliasDuplicateObjects && value && typeof value === "object") {
        ref = sourceObjects.get(value);
        if (ref) {
          ref.anchor ?? (ref.anchor = onAnchor(value));
          return new Alias.Alias(ref.anchor);
        } else {
          ref = { anchor: null, node: null };
          sourceObjects.set(value, ref);
        }
      }
      if (tagName?.startsWith("!!"))
        tagName = defaultTagPrefix + tagName.slice(2);
      let tagObj = findTagObject(value, tagName, schema.tags);
      if (!tagObj) {
        if (value && typeof value.toJSON === "function") {
          value = value.toJSON();
        }
        if (!value || typeof value !== "object") {
          const node2 = new Scalar.Scalar(value);
          if (ref)
            ref.node = node2;
          return node2;
        }
        tagObj = value instanceof Map ? schema[identity.MAP] : Symbol.iterator in Object(value) ? schema[identity.SEQ] : schema[identity.MAP];
      }
      if (onTagObj) {
        onTagObj(tagObj);
        delete ctx.onTagObj;
      }
      const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
      if (tagName)
        node.tag = tagName;
      else if (!tagObj.default)
        node.tag = tagObj.tag;
      if (ref)
        ref.node = node;
      return node;
    }
    exports.createNode = createNode;
  }
});

// node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS({
  "node_modules/yaml/dist/nodes/Collection.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var identity = require_identity();
    var Node = require_Node();
    function collectionFromPath(schema, path11, value) {
      let v = value;
      for (let i = path11.length - 1; i >= 0; --i) {
        const k = path11[i];
        if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
          const a = [];
          a[k] = v;
          v = a;
        } else {
          v = /* @__PURE__ */ new Map([[k, v]]);
        }
      }
      return createNode.createNode(v, void 0, {
        aliasDuplicateObjects: false,
        keepUndefined: false,
        onAnchor: () => {
          throw new Error("This should not happen, please report a bug.");
        },
        schema,
        sourceObjects: /* @__PURE__ */ new Map()
      });
    }
    var isEmptyPath = (path11) => path11 == null || typeof path11 === "object" && !!path11[Symbol.iterator]().next().done;
    var Collection = class extends Node.NodeBase {
      constructor(type, schema) {
        super(type);
        Object.defineProperty(this, "schema", {
          value: schema,
          configurable: true,
          enumerable: false,
          writable: true
        });
      }
      /**
       * Create a copy of this collection.
       *
       * @param schema - If defined, overwrites the original's schema
       */
      clone(schema) {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (schema)
          copy.schema = schema;
        copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /**
       * Adds a value to the collection. For `!!map` and `!!omap` the value must
       * be a Pair instance or a `{ key, value }` object, which may not have a key
       * that already exists in the map.
       */
      addIn(path11, value) {
        if (isEmptyPath(path11))
          this.add(value);
        else {
          const [key, ...rest] = path11;
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.addIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
      /**
       * Removes a value from the collection.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path11) {
        const [key, ...rest] = path11;
        if (rest.length === 0)
          return this.delete(key);
        const node = this.get(key, true);
        if (identity.isCollection(node))
          return node.deleteIn(rest);
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path11, keepScalar) {
        const [key, ...rest] = path11;
        const node = this.get(key, true);
        if (rest.length === 0)
          return !keepScalar && identity.isScalar(node) ? node.value : node;
        else
          return identity.isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
      }
      hasAllNullValues(allowScalar) {
        return this.items.every((node) => {
          if (!identity.isPair(node))
            return false;
          const n = node.value;
          return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
        });
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       */
      hasIn(path11) {
        const [key, ...rest] = path11;
        if (rest.length === 0)
          return this.has(key);
        const node = this.get(key, true);
        return identity.isCollection(node) ? node.hasIn(rest) : false;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path11, value) {
        const [key, ...rest] = path11;
        if (rest.length === 0) {
          this.set(key, value);
        } else {
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.setIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
    };
    exports.Collection = Collection;
    exports.collectionFromPath = collectionFromPath;
    exports.isEmptyPath = isEmptyPath;
  }
});

// node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyComment.js"(exports) {
    "use strict";
    var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
    function indentComment(comment, indent) {
      if (/^\n+$/.test(comment))
        return comment.substring(1);
      return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
    }
    var lineComment = (str, indent, comment) => str.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
    exports.indentComment = indentComment;
    exports.lineComment = lineComment;
    exports.stringifyComment = stringifyComment;
  }
});

// node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS({
  "node_modules/yaml/dist/stringify/foldFlowLines.js"(exports) {
    "use strict";
    var FOLD_FLOW = "flow";
    var FOLD_BLOCK = "block";
    var FOLD_QUOTED = "quoted";
    function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
      if (!lineWidth || lineWidth < 0)
        return text;
      if (lineWidth < minContentWidth)
        minContentWidth = 0;
      const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
      if (text.length <= endStep)
        return text;
      const folds = [];
      const escapedFolds = {};
      let end = lineWidth - indent.length;
      if (typeof indentAtStart === "number") {
        if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
          folds.push(0);
        else
          end = lineWidth - indentAtStart;
      }
      let split = void 0;
      let prev = void 0;
      let overflow = false;
      let i = -1;
      let escStart = -1;
      let escEnd = -1;
      if (mode === FOLD_BLOCK) {
        i = consumeMoreIndentedLines(text, i, indent.length);
        if (i !== -1)
          end = i + endStep;
      }
      for (let ch; ch = text[i += 1]; ) {
        if (mode === FOLD_QUOTED && ch === "\\") {
          escStart = i;
          switch (text[i + 1]) {
            case "x":
              i += 3;
              break;
            case "u":
              i += 5;
              break;
            case "U":
              i += 9;
              break;
            default:
              i += 1;
          }
          escEnd = i;
        }
        if (ch === "\n") {
          if (mode === FOLD_BLOCK)
            i = consumeMoreIndentedLines(text, i, indent.length);
          end = i + indent.length + endStep;
          split = void 0;
        } else {
          if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
            const next = text[i + 1];
            if (next && next !== " " && next !== "\n" && next !== "	")
              split = i;
          }
          if (i >= end) {
            if (split) {
              folds.push(split);
              end = split + endStep;
              split = void 0;
            } else if (mode === FOLD_QUOTED) {
              while (prev === " " || prev === "	") {
                prev = ch;
                ch = text[i += 1];
                overflow = true;
              }
              const j = i > escEnd + 1 ? i - 2 : escStart - 1;
              if (escapedFolds[j])
                return text;
              folds.push(j);
              escapedFolds[j] = true;
              end = j + endStep;
              split = void 0;
            } else {
              overflow = true;
            }
          }
        }
        prev = ch;
      }
      if (overflow && onOverflow)
        onOverflow();
      if (folds.length === 0)
        return text;
      if (onFold)
        onFold();
      let res = text.slice(0, folds[0]);
      for (let i2 = 0; i2 < folds.length; ++i2) {
        const fold = folds[i2];
        const end2 = folds[i2 + 1] || text.length;
        if (fold === 0)
          res = `
${indent}${text.slice(0, end2)}`;
        else {
          if (mode === FOLD_QUOTED && escapedFolds[fold])
            res += `${text[fold]}\\`;
          res += `
${indent}${text.slice(fold + 1, end2)}`;
        }
      }
      return res;
    }
    function consumeMoreIndentedLines(text, i, indent) {
      let end = i;
      let start = i + 1;
      let ch = text[start];
      while (ch === " " || ch === "	") {
        if (i < start + indent) {
          ch = text[++i];
        } else {
          do {
            ch = text[++i];
          } while (ch && ch !== "\n");
          end = i;
          start = i + 1;
          ch = text[start];
        }
      }
      return end;
    }
    exports.FOLD_BLOCK = FOLD_BLOCK;
    exports.FOLD_FLOW = FOLD_FLOW;
    exports.FOLD_QUOTED = FOLD_QUOTED;
    exports.foldFlowLines = foldFlowLines;
  }
});

// node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyString.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var foldFlowLines = require_foldFlowLines();
    var getFoldOptions = (ctx, isBlock) => ({
      indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
      lineWidth: ctx.options.lineWidth,
      minContentWidth: ctx.options.minContentWidth
    });
    var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
    function lineLengthOverLimit(str, lineWidth, indentLength) {
      if (!lineWidth || lineWidth < 0)
        return false;
      const limit = lineWidth - indentLength;
      const strLen = str.length;
      if (strLen <= limit)
        return false;
      for (let i = 0, start = 0; i < strLen; ++i) {
        if (str[i] === "\n") {
          if (i - start > limit)
            return true;
          start = i + 1;
          if (strLen - start <= limit)
            return false;
        }
      }
      return true;
    }
    function doubleQuotedString(value, ctx) {
      const json = JSON.stringify(value);
      if (ctx.options.doubleQuotedAsJSON)
        return json;
      const { implicitKey } = ctx;
      const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      let str = "";
      let start = 0;
      for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
        if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
          str += json.slice(start, i) + "\\ ";
          i += 1;
          start = i;
          ch = "\\";
        }
        if (ch === "\\")
          switch (json[i + 1]) {
            case "u":
              {
                str += json.slice(start, i);
                const code = json.substr(i + 2, 4);
                switch (code) {
                  case "0000":
                    str += "\\0";
                    break;
                  case "0007":
                    str += "\\a";
                    break;
                  case "000b":
                    str += "\\v";
                    break;
                  case "001b":
                    str += "\\e";
                    break;
                  case "0085":
                    str += "\\N";
                    break;
                  case "00a0":
                    str += "\\_";
                    break;
                  case "2028":
                    str += "\\L";
                    break;
                  case "2029":
                    str += "\\P";
                    break;
                  default:
                    if (code.substr(0, 2) === "00")
                      str += "\\x" + code.substr(2);
                    else
                      str += json.substr(i, 6);
                }
                i += 5;
                start = i + 1;
              }
              break;
            case "n":
              if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
                i += 1;
              } else {
                str += json.slice(start, i) + "\n\n";
                while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                  str += "\n";
                  i += 2;
                }
                str += indent;
                if (json[i + 2] === " ")
                  str += "\\";
                i += 1;
                start = i + 1;
              }
              break;
            default:
              i += 1;
          }
      }
      str = start ? str + json.slice(start) : json;
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
    }
    function singleQuotedString(value, ctx) {
      if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
        return doubleQuotedString(value, ctx);
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
      return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function quotedString(value, ctx) {
      const { singleQuote } = ctx.options;
      let qs;
      if (singleQuote === false)
        qs = doubleQuotedString;
      else {
        const hasDouble = value.includes('"');
        const hasSingle = value.includes("'");
        if (hasDouble && !hasSingle)
          qs = singleQuotedString;
        else if (hasSingle && !hasDouble)
          qs = doubleQuotedString;
        else
          qs = singleQuote ? singleQuotedString : doubleQuotedString;
      }
      return qs(value, ctx);
    }
    var blockEndNewlines;
    try {
      blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
    } catch {
      blockEndNewlines = /\n+(?!\n|$)/g;
    }
    function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
      const { blockQuote, commentString, lineWidth } = ctx.options;
      if (!blockQuote || /\n[\t ]+$/.test(value)) {
        return quotedString(value, ctx);
      }
      const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
      const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
      if (!value)
        return literal ? "|\n" : ">\n";
      let chomp;
      let endStart;
      for (endStart = value.length; endStart > 0; --endStart) {
        const ch = value[endStart - 1];
        if (ch !== "\n" && ch !== "	" && ch !== " ")
          break;
      }
      let end = value.substring(endStart);
      const endNlPos = end.indexOf("\n");
      if (endNlPos === -1) {
        chomp = "-";
      } else if (value === end || endNlPos !== end.length - 1) {
        chomp = "+";
        if (onChompKeep)
          onChompKeep();
      } else {
        chomp = "";
      }
      if (end) {
        value = value.slice(0, -end.length);
        if (end[end.length - 1] === "\n")
          end = end.slice(0, -1);
        end = end.replace(blockEndNewlines, `$&${indent}`);
      }
      let startWithSpace = false;
      let startEnd;
      let startNlPos = -1;
      for (startEnd = 0; startEnd < value.length; ++startEnd) {
        const ch = value[startEnd];
        if (ch === " ")
          startWithSpace = true;
        else if (ch === "\n")
          startNlPos = startEnd;
        else
          break;
      }
      let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
      if (start) {
        value = value.substring(start.length);
        start = start.replace(/\n+/g, `$&${indent}`);
      }
      const indentSize = indent ? "2" : "1";
      let header = (startWithSpace ? indentSize : "") + chomp;
      if (comment) {
        header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
        if (onComment)
          onComment();
      }
      if (!literal) {
        const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
        let literalFallback = false;
        const foldOptions = getFoldOptions(ctx, true);
        if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
          foldOptions.onOverflow = () => {
            literalFallback = true;
          };
        }
        const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
        if (!literalFallback)
          return `>${header}
${indent}${body}`;
      }
      value = value.replace(/\n+/g, `$&${indent}`);
      return `|${header}
${indent}${start}${value}${end}`;
    }
    function plainString(item, ctx, onComment, onChompKeep) {
      const { type, value } = item;
      const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
      if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
        return quotedString(value, ctx);
      }
      if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
        return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
      }
      if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes("\n")) {
        return blockString(item, ctx, onComment, onChompKeep);
      }
      if (containsDocumentMarker(value)) {
        if (indent === "") {
          ctx.forceBlockIndent = true;
          return blockString(item, ctx, onComment, onChompKeep);
        } else if (implicitKey && indent === indentStep) {
          return quotedString(value, ctx);
        }
      }
      const str = value.replace(/\n+/g, `$&
${indent}`);
      if (actualString) {
        const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
        const { compat, tags } = ctx.doc.schema;
        if (tags.some(test) || compat?.some(test))
          return quotedString(value, ctx);
      }
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function stringifyString(item, ctx, onComment, onChompKeep) {
      const { implicitKey, inFlow } = ctx;
      const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
      let { type } = item;
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
          type = Scalar.Scalar.QUOTE_DOUBLE;
      }
      const _stringify = (_type) => {
        switch (_type) {
          case Scalar.Scalar.BLOCK_FOLDED:
          case Scalar.Scalar.BLOCK_LITERAL:
            return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
          case Scalar.Scalar.QUOTE_DOUBLE:
            return doubleQuotedString(ss.value, ctx);
          case Scalar.Scalar.QUOTE_SINGLE:
            return singleQuotedString(ss.value, ctx);
          case Scalar.Scalar.PLAIN:
            return plainString(ss, ctx, onComment, onChompKeep);
          default:
            return null;
        }
      };
      let res = _stringify(type);
      if (res === null) {
        const { defaultKeyType, defaultStringType } = ctx.options;
        const t = implicitKey && defaultKeyType || defaultStringType;
        res = _stringify(t);
        if (res === null)
          throw new Error(`Unsupported default string type ${t}`);
      }
      return res;
    }
    exports.stringifyString = stringifyString;
  }
});

// node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS({
  "node_modules/yaml/dist/stringify/stringify.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var identity = require_identity();
    var stringifyComment = require_stringifyComment();
    var stringifyString = require_stringifyString();
    function createStringifyContext(doc, options) {
      const opt = Object.assign({
        blockQuote: true,
        commentString: stringifyComment.stringifyComment,
        defaultKeyType: null,
        defaultStringType: "PLAIN",
        directives: null,
        doubleQuotedAsJSON: false,
        doubleQuotedMinMultiLineLength: 40,
        falseStr: "false",
        flowCollectionPadding: true,
        indentSeq: true,
        lineWidth: 80,
        minContentWidth: 20,
        nullStr: "null",
        simpleKeys: false,
        singleQuote: null,
        trailingComma: false,
        trueStr: "true",
        verifyAliasOrder: true
      }, doc.schema.toStringOptions, options);
      let inFlow;
      switch (opt.collectionStyle) {
        case "block":
          inFlow = false;
          break;
        case "flow":
          inFlow = true;
          break;
        default:
          inFlow = null;
      }
      return {
        anchors: /* @__PURE__ */ new Set(),
        doc,
        flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
        indent: "",
        indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
        inFlow,
        options: opt
      };
    }
    function getTagObject(tags, item) {
      if (item.tag) {
        const match = tags.filter((t) => t.tag === item.tag);
        if (match.length > 0)
          return match.find((t) => t.format === item.format) ?? match[0];
      }
      let tagObj = void 0;
      let obj;
      if (identity.isScalar(item)) {
        obj = item.value;
        let match = tags.filter((t) => t.identify?.(obj));
        if (match.length > 1) {
          const testMatch = match.filter((t) => t.test);
          if (testMatch.length > 0)
            match = testMatch;
        }
        tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
      } else {
        obj = item;
        tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
      }
      if (!tagObj) {
        const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
        throw new Error(`Tag not resolved for ${name} value`);
      }
      return tagObj;
    }
    function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
      if (!doc.directives)
        return "";
      const props = [];
      const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
      if (anchor && anchors.anchorIsValid(anchor)) {
        anchors$1.add(anchor);
        props.push(`&${anchor}`);
      }
      const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
      if (tag)
        props.push(doc.directives.tagString(tag));
      return props.join(" ");
    }
    function stringify(item, ctx, onComment, onChompKeep) {
      if (identity.isPair(item))
        return item.toString(ctx, onComment, onChompKeep);
      if (identity.isAlias(item)) {
        if (ctx.doc.directives)
          return item.toString(ctx);
        if (ctx.resolvedAliases?.has(item)) {
          throw new TypeError(`Cannot stringify circular structure without alias nodes`);
        } else {
          if (ctx.resolvedAliases)
            ctx.resolvedAliases.add(item);
          else
            ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
          item = item.resolve(ctx.doc);
        }
      }
      let tagObj = void 0;
      const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
      tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
      const props = stringifyProps(node, tagObj, ctx);
      if (props.length > 0)
        ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
      const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
      if (!props)
        return str;
      return identity.isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
    }
    exports.createStringifyContext = createStringifyContext;
    exports.stringify = stringify;
  }
});

// node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyPair.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
      const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
      let keyComment = identity.isNode(key) && key.comment || null;
      if (simpleKeys) {
        if (keyComment) {
          throw new Error("With simple keys, key nodes cannot have comments");
        }
        if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
          const msg = "With simple keys, collection cannot be used as a key value";
          throw new Error(msg);
        }
      }
      let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
      ctx = Object.assign({}, ctx, {
        allNullValues: false,
        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
        indent: indent + indentStep
      });
      let keyCommentDone = false;
      let chompKeep = false;
      let str = stringify.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
      if (!explicitKey && !ctx.inFlow && str.length > 1024) {
        if (simpleKeys)
          throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
        explicitKey = true;
      }
      if (ctx.inFlow) {
        if (allNullValues || value == null) {
          if (keyCommentDone && onComment)
            onComment();
          return str === "" ? "?" : explicitKey ? `? ${str}` : str;
        }
      } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
        str = `? ${str}`;
        if (keyComment && !keyCommentDone) {
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        } else if (chompKeep && onChompKeep)
          onChompKeep();
        return str;
      }
      if (keyCommentDone)
        keyComment = null;
      if (explicitKey) {
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        str = `? ${str}
${indent}:`;
      } else {
        str = `${str}:`;
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      }
      let vsb, vcb, valueComment;
      if (identity.isNode(value)) {
        vsb = !!value.spaceBefore;
        vcb = value.commentBefore;
        valueComment = value.comment;
      } else {
        vsb = false;
        vcb = null;
        valueComment = null;
        if (value && typeof value === "object")
          value = doc.createNode(value);
      }
      ctx.implicitKey = false;
      if (!explicitKey && !keyComment && identity.isScalar(value))
        ctx.indentAtStart = str.length + 1;
      chompKeep = false;
      if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
        ctx.indent = ctx.indent.substring(2);
      }
      let valueCommentDone = false;
      const valueStr = stringify.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
      let ws = " ";
      if (keyComment || vsb || vcb) {
        ws = vsb ? "\n" : "";
        if (vcb) {
          const cs = commentString(vcb);
          ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
        }
        if (valueStr === "" && !ctx.inFlow) {
          if (ws === "\n" && valueComment)
            ws = "\n\n";
        } else {
          ws += `
${ctx.indent}`;
        }
      } else if (!explicitKey && identity.isCollection(value)) {
        const vs0 = valueStr[0];
        const nl0 = valueStr.indexOf("\n");
        const hasNewline = nl0 !== -1;
        const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
        if (hasNewline || !flow) {
          let hasPropsLine = false;
          if (hasNewline && (vs0 === "&" || vs0 === "!")) {
            let sp0 = valueStr.indexOf(" ");
            if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
              sp0 = valueStr.indexOf(" ", sp0 + 1);
            }
            if (sp0 === -1 || nl0 < sp0)
              hasPropsLine = true;
          }
          if (!hasPropsLine)
            ws = `
${ctx.indent}`;
        }
      } else if (valueStr === "" || valueStr[0] === "\n") {
        ws = "";
      }
      str += ws + valueStr;
      if (ctx.inFlow) {
        if (valueCommentDone && onComment)
          onComment();
      } else if (valueComment && !valueCommentDone) {
        str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
      } else if (chompKeep && onChompKeep) {
        onChompKeep();
      }
      return str;
    }
    exports.stringifyPair = stringifyPair;
  }
});

// node_modules/yaml/dist/log.js
var require_log = __commonJS({
  "node_modules/yaml/dist/log.js"(exports) {
    "use strict";
    var node_process = __require("process");
    function debug(logLevel, ...messages) {
      if (logLevel === "debug")
        console.log(...messages);
    }
    function warn(logLevel, warning) {
      if (logLevel === "debug" || logLevel === "warn") {
        if (typeof node_process.emitWarning === "function")
          node_process.emitWarning(warning);
        else
          console.warn(warning);
      }
    }
    exports.debug = debug;
    exports.warn = warn;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/merge.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var MERGE_KEY = "<<";
    var merge = {
      identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
      default: "key",
      tag: "tag:yaml.org,2002:merge",
      test: /^<<$/,
      resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
        addToJSMap: addMergeToJSMap
      }),
      stringify: () => MERGE_KEY
    };
    var isMergeKey = (ctx, key) => (merge.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
    function addMergeToJSMap(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (identity.isSeq(source))
        for (const it of source.items)
          mergeValue(ctx, map, it);
      else if (Array.isArray(source))
        for (const it of source)
          mergeValue(ctx, map, it);
      else
        mergeValue(ctx, map, source);
    }
    function mergeValue(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (!identity.isMap(source))
        throw new Error("Merge sources must be maps or map aliases");
      const srcMap = source.toJSON(null, ctx, Map);
      for (const [key, value2] of srcMap) {
        if (map instanceof Map) {
          if (!map.has(key))
            map.set(key, value2);
        } else if (map instanceof Set) {
          map.add(key);
        } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
          Object.defineProperty(map, key, {
            value: value2,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
      return map;
    }
    function resolveAliasValue(ctx, value) {
      return ctx && identity.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
    }
    exports.addMergeToJSMap = addMergeToJSMap;
    exports.isMergeKey = isMergeKey;
    exports.merge = merge;
  }
});

// node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS({
  "node_modules/yaml/dist/nodes/addPairToJSMap.js"(exports) {
    "use strict";
    var log = require_log();
    var merge = require_merge();
    var stringify = require_stringify();
    var identity = require_identity();
    var toJS = require_toJS();
    function addPairToJSMap(ctx, map, { key, value }) {
      if (identity.isNode(key) && key.addToJSMap)
        key.addToJSMap(ctx, map, value);
      else if (merge.isMergeKey(ctx, key))
        merge.addMergeToJSMap(ctx, map, value);
      else {
        const jsKey = toJS.toJS(key, "", ctx);
        if (map instanceof Map) {
          map.set(jsKey, toJS.toJS(value, jsKey, ctx));
        } else if (map instanceof Set) {
          map.add(jsKey);
        } else {
          const stringKey = stringifyKey(key, jsKey, ctx);
          const jsValue = toJS.toJS(value, stringKey, ctx);
          if (stringKey in map)
            Object.defineProperty(map, stringKey, {
              value: jsValue,
              writable: true,
              enumerable: true,
              configurable: true
            });
          else
            map[stringKey] = jsValue;
        }
      }
      return map;
    }
    function stringifyKey(key, jsKey, ctx) {
      if (jsKey === null)
        return "";
      if (typeof jsKey !== "object")
        return String(jsKey);
      if (identity.isNode(key) && ctx?.doc) {
        const strCtx = stringify.createStringifyContext(ctx.doc, {});
        strCtx.anchors = /* @__PURE__ */ new Set();
        for (const node of ctx.anchors.keys())
          strCtx.anchors.add(node.anchor);
        strCtx.inFlow = true;
        strCtx.inStringifyKey = true;
        const strKey = key.toString(strCtx);
        if (!ctx.mapKeyWarned) {
          let jsonStr = JSON.stringify(strKey);
          if (jsonStr.length > 40)
            jsonStr = jsonStr.substring(0, 36) + '..."';
          log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
          ctx.mapKeyWarned = true;
        }
        return strKey;
      }
      return JSON.stringify(jsKey);
    }
    exports.addPairToJSMap = addPairToJSMap;
  }
});

// node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS({
  "node_modules/yaml/dist/nodes/Pair.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyPair = require_stringifyPair();
    var addPairToJSMap = require_addPairToJSMap();
    var identity = require_identity();
    function createPair(key, value, ctx) {
      const k = createNode.createNode(key, void 0, ctx);
      const v = createNode.createNode(value, void 0, ctx);
      return new Pair(k, v);
    }
    var Pair = class _Pair {
      constructor(key, value = null) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
        this.key = key;
        this.value = value;
      }
      clone(schema) {
        let { key, value } = this;
        if (identity.isNode(key))
          key = key.clone(schema);
        if (identity.isNode(value))
          value = value.clone(schema);
        return new _Pair(key, value);
      }
      toJSON(_, ctx) {
        const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        return addPairToJSMap.addPairToJSMap(ctx, pair, this);
      }
      toString(ctx, onComment, onChompKeep) {
        return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
      }
    };
    exports.Pair = Pair;
    exports.createPair = createPair;
  }
});

// node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyCollection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyCollection(collection, ctx, options) {
      const flow = ctx.inFlow ?? collection.flow;
      const stringify2 = flow ? stringifyFlowCollection : stringifyBlockCollection;
      return stringify2(collection, ctx, options);
    }
    function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
      const { indent, options: { commentString } } = ctx;
      const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
      let chompKeep = false;
      const lines2 = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment2 = null;
        if (identity.isNode(item)) {
          if (!chompKeep && item.spaceBefore)
            lines2.push("");
          addCommentBefore(ctx, lines2, item.commentBefore, chompKeep);
          if (item.comment)
            comment2 = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (!chompKeep && ik.spaceBefore)
              lines2.push("");
            addCommentBefore(ctx, lines2, ik.commentBefore, chompKeep);
          }
        }
        chompKeep = false;
        let str2 = stringify.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
        if (comment2)
          str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment2));
        if (chompKeep && comment2)
          chompKeep = false;
        lines2.push(blockItemPrefix + str2);
      }
      let str;
      if (lines2.length === 0) {
        str = flowChars.start + flowChars.end;
      } else {
        str = lines2[0];
        for (let i = 1; i < lines2.length; ++i) {
          const line = lines2[i];
          str += line ? `
${indent}${line}` : "\n";
        }
      }
      if (comment) {
        str += "\n" + stringifyComment.indentComment(commentString(comment), indent);
        if (onComment)
          onComment();
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str;
    }
    function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
      const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
      itemIndent += indentStep;
      const itemCtx = Object.assign({}, ctx, {
        indent: itemIndent,
        inFlow: true,
        type: null
      });
      let reqNewline = false;
      let linesAtValue = 0;
      const lines2 = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment = null;
        if (identity.isNode(item)) {
          if (item.spaceBefore)
            lines2.push("");
          addCommentBefore(ctx, lines2, item.commentBefore, false);
          if (item.comment)
            comment = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (ik.spaceBefore)
              lines2.push("");
            addCommentBefore(ctx, lines2, ik.commentBefore, false);
            if (ik.comment)
              reqNewline = true;
          }
          const iv = identity.isNode(item.value) ? item.value : null;
          if (iv) {
            if (iv.comment)
              comment = iv.comment;
            if (iv.commentBefore)
              reqNewline = true;
          } else if (item.value == null && ik?.comment) {
            comment = ik.comment;
          }
        }
        if (comment)
          reqNewline = true;
        let str = stringify.stringify(item, itemCtx, () => comment = null);
        reqNewline || (reqNewline = lines2.length > linesAtValue || str.includes("\n"));
        if (i < items.length - 1) {
          str += ",";
        } else if (ctx.options.trailingComma) {
          if (ctx.options.lineWidth > 0) {
            reqNewline || (reqNewline = lines2.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
          }
          if (reqNewline) {
            str += ",";
          }
        }
        if (comment)
          str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
        lines2.push(str);
        linesAtValue = lines2.length;
      }
      const { start, end } = flowChars;
      if (lines2.length === 0) {
        return start + end;
      } else {
        if (!reqNewline) {
          const len = lines2.reduce((sum, line) => sum + line.length + 2, 2);
          reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
        }
        if (reqNewline) {
          let str = start;
          for (const line of lines2)
            str += line ? `
${indentStep}${indent}${line}` : "\n";
          return `${str}
${indent}${end}`;
        } else {
          return `${start}${fcPadding}${lines2.join(" ")}${fcPadding}${end}`;
        }
      }
    }
    function addCommentBefore({ indent, options: { commentString } }, lines2, comment, chompKeep) {
      if (comment && chompKeep)
        comment = comment.replace(/^\n+/, "");
      if (comment) {
        const ic = stringifyComment.indentComment(commentString(comment), indent);
        lines2.push(ic.trimStart());
      }
    }
    exports.stringifyCollection = stringifyCollection;
  }
});

// node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLMap.js"(exports) {
    "use strict";
    var stringifyCollection = require_stringifyCollection();
    var addPairToJSMap = require_addPairToJSMap();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    function findPair(items, key) {
      const k = identity.isScalar(key) ? key.value : key;
      for (const it of items) {
        if (identity.isPair(it)) {
          if (it.key === key || it.key === k)
            return it;
          if (identity.isScalar(it.key) && it.key.value === k)
            return it;
        }
      }
      return void 0;
    }
    var YAMLMap = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:map";
      }
      constructor(schema) {
        super(identity.MAP, schema);
        this.items = [];
      }
      /**
       * A generic collection parsing method that can be extended
       * to other node classes that inherit from YAMLMap
       */
      static from(schema, obj, ctx) {
        const { keepUndefined, replacer } = ctx;
        const map = new this(schema);
        const add = (key, value) => {
          if (typeof replacer === "function")
            value = replacer.call(obj, key, value);
          else if (Array.isArray(replacer) && !replacer.includes(key))
            return;
          if (value !== void 0 || keepUndefined)
            map.items.push(Pair.createPair(key, value, ctx));
        };
        if (obj instanceof Map) {
          for (const [key, value] of obj)
            add(key, value);
        } else if (obj && typeof obj === "object") {
          for (const key of Object.keys(obj))
            add(key, obj[key]);
        }
        if (typeof schema.sortMapEntries === "function") {
          map.items.sort(schema.sortMapEntries);
        }
        return map;
      }
      /**
       * Adds a value to the collection.
       *
       * @param overwrite - If not set `true`, using a key that is already in the
       *   collection will throw. Otherwise, overwrites the previous value.
       */
      add(pair, overwrite) {
        let _pair;
        if (identity.isPair(pair))
          _pair = pair;
        else if (!pair || typeof pair !== "object" || !("key" in pair)) {
          _pair = new Pair.Pair(pair, pair?.value);
        } else
          _pair = new Pair.Pair(pair.key, pair.value);
        const prev = findPair(this.items, _pair.key);
        const sortEntries = this.schema?.sortMapEntries;
        if (prev) {
          if (!overwrite)
            throw new Error(`Key ${_pair.key} already set`);
          if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
            prev.value.value = _pair.value;
          else
            prev.value = _pair.value;
        } else if (sortEntries) {
          const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
          if (i === -1)
            this.items.push(_pair);
          else
            this.items.splice(i, 0, _pair);
        } else {
          this.items.push(_pair);
        }
      }
      delete(key) {
        const it = findPair(this.items, key);
        if (!it)
          return false;
        const del = this.items.splice(this.items.indexOf(it), 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const it = findPair(this.items, key);
        const node = it?.value;
        return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? void 0;
      }
      has(key) {
        return !!findPair(this.items, key);
      }
      set(key, value) {
        this.add(new Pair.Pair(key, value), true);
      }
      /**
       * @param ctx - Conversion context, originally set in Document#toJS()
       * @param {Class} Type - If set, forces the returned collection type
       * @returns Instance of Type, Map, or Object
       */
      toJSON(_, ctx, Type) {
        const map = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const item of this.items)
          addPairToJSMap.addPairToJSMap(ctx, map, item);
        return map;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        for (const item of this.items) {
          if (!identity.isPair(item))
            throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
        }
        if (!ctx.allNullValues && this.hasAllNullValues(false))
          ctx = Object.assign({}, ctx, { allNullValues: true });
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "",
          flowChars: { start: "{", end: "}" },
          itemIndent: ctx.indent || "",
          onChompKeep,
          onComment
        });
      }
    };
    exports.YAMLMap = YAMLMap;
    exports.findPair = findPair;
  }
});

// node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS({
  "node_modules/yaml/dist/schema/common/map.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLMap = require_YAMLMap();
    var map = {
      collection: "map",
      default: true,
      nodeClass: YAMLMap.YAMLMap,
      tag: "tag:yaml.org,2002:map",
      resolve(map2, onError) {
        if (!identity.isMap(map2))
          onError("Expected a mapping for this tag");
        return map2;
      },
      createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
    };
    exports.map = map;
  }
});

// node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLSeq.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyCollection = require_stringifyCollection();
    var Collection = require_Collection();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var toJS = require_toJS();
    var YAMLSeq = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:seq";
      }
      constructor(schema) {
        super(identity.SEQ, schema);
        this.items = [];
      }
      add(value) {
        this.items.push(value);
      }
      /**
       * Removes a value from the collection.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       *
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return false;
        const del = this.items.splice(idx, 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return void 0;
        const it = this.items[idx];
        return !keepScalar && identity.isScalar(it) ? it.value : it;
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       */
      has(key) {
        const idx = asItemIndex(key);
        return typeof idx === "number" && idx < this.items.length;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       *
       * If `key` does not contain a representation of an integer, this will throw.
       * It may be wrapped in a `Scalar`.
       */
      set(key, value) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          throw new Error(`Expected a valid index, not ${key}.`);
        const prev = this.items[idx];
        if (identity.isScalar(prev) && Scalar.isScalarValue(value))
          prev.value = value;
        else
          this.items[idx] = value;
      }
      toJSON(_, ctx) {
        const seq = [];
        if (ctx?.onCreate)
          ctx.onCreate(seq);
        let i = 0;
        for (const item of this.items)
          seq.push(toJS.toJS(item, String(i++), ctx));
        return seq;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "- ",
          flowChars: { start: "[", end: "]" },
          itemIndent: (ctx.indent || "") + "  ",
          onChompKeep,
          onComment
        });
      }
      static from(schema, obj, ctx) {
        const { replacer } = ctx;
        const seq = new this(schema);
        if (obj && Symbol.iterator in Object(obj)) {
          let i = 0;
          for (let it of obj) {
            if (typeof replacer === "function") {
              const key = obj instanceof Set ? it : String(i++);
              it = replacer.call(obj, key, it);
            }
            seq.items.push(createNode.createNode(it, void 0, ctx));
          }
        }
        return seq;
      }
    };
    function asItemIndex(key) {
      let idx = identity.isScalar(key) ? key.value : key;
      if (idx && typeof idx === "string")
        idx = Number(idx);
      return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
    }
    exports.YAMLSeq = YAMLSeq;
  }
});

// node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS({
  "node_modules/yaml/dist/schema/common/seq.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLSeq = require_YAMLSeq();
    var seq = {
      collection: "seq",
      default: true,
      nodeClass: YAMLSeq.YAMLSeq,
      tag: "tag:yaml.org,2002:seq",
      resolve(seq2, onError) {
        if (!identity.isSeq(seq2))
          onError("Expected a sequence for this tag");
        return seq2;
      },
      createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
    };
    exports.seq = seq;
  }
});

// node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS({
  "node_modules/yaml/dist/schema/common/string.js"(exports) {
    "use strict";
    var stringifyString = require_stringifyString();
    var string = {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str) => str,
      stringify(item, ctx, onComment, onChompKeep) {
        ctx = Object.assign({ actualString: true }, ctx);
        return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
      }
    };
    exports.string = string;
  }
});

// node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS({
  "node_modules/yaml/dist/schema/common/null.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var nullTag = {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^(?:~|[Nn]ull|NULL)?$/,
      resolve: () => new Scalar.Scalar(null),
      stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
    };
    exports.nullTag = nullTag;
  }
});

// node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS({
  "node_modules/yaml/dist/schema/core/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var boolTag = {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
      resolve: (str) => new Scalar.Scalar(str[0] === "t" || str[0] === "T"),
      stringify({ source, value }, ctx) {
        if (source && boolTag.test.test(source)) {
          const sv = source[0] === "t" || source[0] === "T";
          if (value === sv)
            return source;
        }
        return value ? ctx.options.trueStr : ctx.options.falseStr;
      }
    };
    exports.boolTag = boolTag;
  }
});

// node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyNumber.js"(exports) {
    "use strict";
    function stringifyNumber({ format, minFractionDigits, tag, value }) {
      if (typeof value === "bigint")
        return String(value);
      const num2 = typeof value === "number" ? value : Number(value);
      if (!isFinite(num2))
        return isNaN(num2) ? ".nan" : num2 < 0 ? "-.inf" : ".inf";
      let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
      if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
        let i = n.indexOf(".");
        if (i < 0) {
          i = n.length;
          n += ".";
        }
        let d = minFractionDigits - (n.length - i - 1);
        while (d-- > 0)
          n += "0";
      }
      return n;
    }
    exports.stringifyNumber = stringifyNumber;
  }
});

// node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS({
  "node_modules/yaml/dist/schema/core/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str),
      stringify(node) {
        const num2 = Number(node.value);
        return isFinite(num2) ? num2.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str));
        const dot = str.indexOf(".");
        if (dot !== -1 && str[str.length - 1] === "0")
          node.minFractionDigits = str.length - dot - 1;
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS({
  "node_modules/yaml/dist/schema/core/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value) && value >= 0)
        return prefix + value.toString(radix);
      return stringifyNumber.stringifyNumber(node);
    }
    var intOct = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^0o[0-7]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
      stringify: (node) => intStringify(node, 8, "0o")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^0x[0-9a-fA-F]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS({
  "node_modules/yaml/dist/schema/core/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.boolTag,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float
    ];
    exports.schema = schema;
  }
});

// node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS({
  "node_modules/yaml/dist/schema/json/schema.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var map = require_map();
    var seq = require_seq();
    function intIdentify(value) {
      return typeof value === "bigint" || Number.isInteger(value);
    }
    var stringifyJSON = ({ value }) => JSON.stringify(value);
    var jsonScalars = [
      {
        identify: (value) => typeof value === "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: (str) => str,
        stringify: stringifyJSON
      },
      {
        identify: (value) => value == null,
        createNode: () => new Scalar.Scalar(null),
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^null$/,
        resolve: () => null,
        stringify: stringifyJSON
      },
      {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^true$|^false$/,
        resolve: (str) => str === "true",
        stringify: stringifyJSON
      },
      {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
        stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
      },
      {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: (str) => parseFloat(str),
        stringify: stringifyJSON
      }
    ];
    var jsonError = {
      default: true,
      tag: "",
      test: /^/,
      resolve(str, onError) {
        onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
        return str;
      }
    };
    var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
    exports.schema = schema;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/binary.js"(exports) {
    "use strict";
    var node_buffer = __require("buffer");
    var Scalar = require_Scalar();
    var stringifyString = require_stringifyString();
    var binary = {
      identify: (value) => value instanceof Uint8Array,
      // Buffer inherits from Uint8Array
      default: false,
      tag: "tag:yaml.org,2002:binary",
      /**
       * Returns a Buffer in node and an Uint8Array in browsers
       *
       * To use the resulting buffer as an image, you'll want to do something like:
       *
       *   const blob = new Blob([buffer], { type: 'image/jpeg' })
       *   document.querySelector('#photo').src = URL.createObjectURL(blob)
       */
      resolve(src, onError) {
        if (typeof node_buffer.Buffer === "function") {
          return node_buffer.Buffer.from(src, "base64");
        } else if (typeof atob === "function") {
          const str = atob(src.replace(/[\n\r]/g, ""));
          const buffer = new Uint8Array(str.length);
          for (let i = 0; i < str.length; ++i)
            buffer[i] = str.charCodeAt(i);
          return buffer;
        } else {
          onError("This environment does not support reading binary tags; either Buffer or atob is required");
          return src;
        }
      },
      stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
        if (!value)
          return "";
        const buf = value;
        let str;
        if (typeof node_buffer.Buffer === "function") {
          str = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
        } else if (typeof btoa === "function") {
          let s = "";
          for (let i = 0; i < buf.length; ++i)
            s += String.fromCharCode(buf[i]);
          str = btoa(s);
        } else {
          throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
        }
        type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
        if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
          const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
          const n = Math.ceil(str.length / lineWidth);
          const lines2 = new Array(n);
          for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
            lines2[i] = str.substr(o, lineWidth);
          }
          str = lines2.join(type === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
        }
        return stringifyString.stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
      }
    };
    exports.binary = binary;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/pairs.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLSeq = require_YAMLSeq();
    function resolvePairs(seq, onError) {
      if (identity.isSeq(seq)) {
        for (let i = 0; i < seq.items.length; ++i) {
          let item = seq.items[i];
          if (identity.isPair(item))
            continue;
          else if (identity.isMap(item)) {
            if (item.items.length > 1)
              onError("Each pair must have its own sequence indicator");
            const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
            if (item.commentBefore)
              pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
            if (item.comment) {
              const cn = pair.value ?? pair.key;
              cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
            }
            item = pair;
          }
          seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
        }
      } else
        onError("Expected a sequence for this tag");
      return seq;
    }
    function createPairs(schema, iterable, ctx) {
      const { replacer } = ctx;
      const pairs2 = new YAMLSeq.YAMLSeq(schema);
      pairs2.tag = "tag:yaml.org,2002:pairs";
      let i = 0;
      if (iterable && Symbol.iterator in Object(iterable))
        for (let it of iterable) {
          if (typeof replacer === "function")
            it = replacer.call(iterable, String(i++), it);
          let key, value;
          if (Array.isArray(it)) {
            if (it.length === 2) {
              key = it[0];
              value = it[1];
            } else
              throw new TypeError(`Expected [key, value] tuple: ${it}`);
          } else if (it && it instanceof Object) {
            const keys = Object.keys(it);
            if (keys.length === 1) {
              key = keys[0];
              value = it[key];
            } else {
              throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
            }
          } else {
            key = it;
          }
          pairs2.items.push(Pair.createPair(key, value, ctx));
        }
      return pairs2;
    }
    var pairs = {
      collection: "seq",
      default: false,
      tag: "tag:yaml.org,2002:pairs",
      resolve: resolvePairs,
      createNode: createPairs
    };
    exports.createPairs = createPairs;
    exports.pairs = pairs;
    exports.resolvePairs = resolvePairs;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/omap.js"(exports) {
    "use strict";
    var identity = require_identity();
    var toJS = require_toJS();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var pairs = require_pairs();
    var YAMLOMap = class _YAMLOMap extends YAMLSeq.YAMLSeq {
      constructor() {
        super();
        this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
        this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
        this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
        this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
        this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
        this.tag = _YAMLOMap.tag;
      }
      /**
       * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
       * but TypeScript won't allow widening the signature of a child method.
       */
      toJSON(_, ctx) {
        if (!ctx)
          return super.toJSON(_);
        const map = /* @__PURE__ */ new Map();
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const pair of this.items) {
          let key, value;
          if (identity.isPair(pair)) {
            key = toJS.toJS(pair.key, "", ctx);
            value = toJS.toJS(pair.value, key, ctx);
          } else {
            key = toJS.toJS(pair, "", ctx);
          }
          if (map.has(key))
            throw new Error("Ordered maps must not include duplicate keys");
          map.set(key, value);
        }
        return map;
      }
      static from(schema, iterable, ctx) {
        const pairs$1 = pairs.createPairs(schema, iterable, ctx);
        const omap2 = new this();
        omap2.items = pairs$1.items;
        return omap2;
      }
    };
    YAMLOMap.tag = "tag:yaml.org,2002:omap";
    var omap = {
      collection: "seq",
      identify: (value) => value instanceof Map,
      nodeClass: YAMLOMap,
      default: false,
      tag: "tag:yaml.org,2002:omap",
      resolve(seq, onError) {
        const pairs$1 = pairs.resolvePairs(seq, onError);
        const seenKeys = [];
        for (const { key } of pairs$1.items) {
          if (identity.isScalar(key)) {
            if (seenKeys.includes(key.value)) {
              onError(`Ordered maps must not include duplicate keys: ${key.value}`);
            } else {
              seenKeys.push(key.value);
            }
          }
        }
        return Object.assign(new YAMLOMap(), pairs$1);
      },
      createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
    };
    exports.YAMLOMap = YAMLOMap;
    exports.omap = omap;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function boolStringify({ value, source }, ctx) {
      const boolObj = value ? trueTag : falseTag;
      if (source && boolObj.test.test(source))
        return source;
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
    var trueTag = {
      identify: (value) => value === true,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
      resolve: () => new Scalar.Scalar(true),
      stringify: boolStringify
    };
    var falseTag = {
      identify: (value) => value === false,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
      resolve: () => new Scalar.Scalar(false),
      stringify: boolStringify
    };
    exports.falseTag = falseTag;
    exports.trueTag = trueTag;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str.replace(/_/g, "")),
      stringify(node) {
        const num2 = Number(node.value);
        return isFinite(num2) ? num2.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str.replace(/_/g, "")));
        const dot = str.indexOf(".");
        if (dot !== -1) {
          const f = str.substring(dot + 1).replace(/_/g, "");
          if (f[f.length - 1] === "0")
            node.minFractionDigits = f.length;
        }
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    function intResolve(str, offset, radix, { intAsBigInt }) {
      const sign = str[0];
      if (sign === "-" || sign === "+")
        offset += 1;
      str = str.substring(offset).replace(/_/g, "");
      if (intAsBigInt) {
        switch (radix) {
          case 2:
            str = `0b${str}`;
            break;
          case 8:
            str = `0o${str}`;
            break;
          case 16:
            str = `0x${str}`;
            break;
        }
        const n2 = BigInt(str);
        return sign === "-" ? BigInt(-1) * n2 : n2;
      }
      const n = parseInt(str, radix);
      return sign === "-" ? -1 * n : n;
    }
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value)) {
        const str = value.toString(radix);
        return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
      }
      return stringifyNumber.stringifyNumber(node);
    }
    var intBin = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "BIN",
      test: /^[-+]?0b[0-1_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
      stringify: (node) => intStringify(node, 2, "0b")
    };
    var intOct = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^[-+]?0[0-7_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
      stringify: (node) => intStringify(node, 8, "0")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9][0-9_]*$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^[-+]?0x[0-9a-fA-F_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int;
    exports.intBin = intBin;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/set.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSet = class _YAMLSet extends YAMLMap.YAMLMap {
      constructor(schema) {
        super(schema);
        this.tag = _YAMLSet.tag;
      }
      add(key) {
        let pair;
        if (identity.isPair(key))
          pair = key;
        else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
          pair = new Pair.Pair(key.key, null);
        else
          pair = new Pair.Pair(key, null);
        const prev = YAMLMap.findPair(this.items, pair.key);
        if (!prev)
          this.items.push(pair);
      }
      /**
       * If `keepPair` is `true`, returns the Pair matching `key`.
       * Otherwise, returns the value of that Pair's key.
       */
      get(key, keepPair) {
        const pair = YAMLMap.findPair(this.items, key);
        return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
      }
      set(key, value) {
        if (typeof value !== "boolean")
          throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
        const prev = YAMLMap.findPair(this.items, key);
        if (prev && !value) {
          this.items.splice(this.items.indexOf(prev), 1);
        } else if (!prev && value) {
          this.items.push(new Pair.Pair(key));
        }
      }
      toJSON(_, ctx) {
        return super.toJSON(_, ctx, Set);
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        if (this.hasAllNullValues(true))
          return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
        else
          throw new Error("Set items must all have null values");
      }
      static from(schema, iterable, ctx) {
        const { replacer } = ctx;
        const set2 = new this(schema);
        if (iterable && Symbol.iterator in Object(iterable))
          for (let value of iterable) {
            if (typeof replacer === "function")
              value = replacer.call(iterable, value, value);
            set2.items.push(Pair.createPair(value, null, ctx));
          }
        return set2;
      }
    };
    YAMLSet.tag = "tag:yaml.org,2002:set";
    var set = {
      collection: "map",
      identify: (value) => value instanceof Set,
      nodeClass: YAMLSet,
      default: false,
      tag: "tag:yaml.org,2002:set",
      createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
      resolve(map, onError) {
        if (identity.isMap(map)) {
          if (map.hasAllNullValues(true))
            return Object.assign(new YAMLSet(), map);
          else
            onError("Set items must all have null values");
        } else
          onError("Expected a mapping for this tag");
        return map;
      }
    };
    exports.YAMLSet = YAMLSet;
    exports.set = set;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/timestamp.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    function parseSexagesimal(str, asBigInt) {
      const sign = str[0];
      const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
      const num2 = (n) => asBigInt ? BigInt(n) : Number(n);
      const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num2(60) + num2(p), num2(0));
      return sign === "-" ? num2(-1) * res : res;
    }
    function stringifySexagesimal(node) {
      let { value } = node;
      let num2 = (n) => n;
      if (typeof value === "bigint")
        num2 = (n) => BigInt(n);
      else if (isNaN(value) || !isFinite(value))
        return stringifyNumber.stringifyNumber(node);
      let sign = "";
      if (value < 0) {
        sign = "-";
        value *= num2(-1);
      }
      const _60 = num2(60);
      const parts = [value % _60];
      if (value < 60) {
        parts.unshift(0);
      } else {
        value = (value - parts[0]) / _60;
        parts.unshift(value % _60);
        if (value >= 60) {
          value = (value - parts[0]) / _60;
          parts.unshift(value);
        }
      }
      return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
    }
    var intTime = {
      identify: (value) => typeof value === "bigint" || Number.isInteger(value),
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
      resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
      stringify: stringifySexagesimal
    };
    var floatTime = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
      resolve: (str) => parseSexagesimal(str, false),
      stringify: stringifySexagesimal
    };
    var timestamp = {
      identify: (value) => value instanceof Date,
      default: true,
      tag: "tag:yaml.org,2002:timestamp",
      // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
      // may be omitted altogether, resulting in a date format. In such a case, the time part is
      // assumed to be 00:00:00Z (start of day, UTC).
      test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
      resolve(str) {
        const match = str.match(timestamp.test);
        if (!match)
          throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
        const [, year, month, day, hour, minute, second] = match.map(Number);
        const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
        let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
        const tz = match[8];
        if (tz && tz !== "Z") {
          let d = parseSexagesimal(tz, false);
          if (Math.abs(d) < 30)
            d *= 60;
          date -= 6e4 * d;
        }
        return new Date(date);
      },
      stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
    };
    exports.floatTime = floatTime;
    exports.intTime = intTime;
    exports.timestamp = timestamp;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var binary = require_binary();
    var bool = require_bool2();
    var float = require_float2();
    var int = require_int2();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var set = require_set();
    var timestamp = require_timestamp();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.trueTag,
      bool.falseTag,
      int.intBin,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float,
      binary.binary,
      merge.merge,
      omap.omap,
      pairs.pairs,
      set.set,
      timestamp.intTime,
      timestamp.floatTime,
      timestamp.timestamp
    ];
    exports.schema = schema;
  }
});

// node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS({
  "node_modules/yaml/dist/schema/tags.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = require_schema();
    var schema$1 = require_schema2();
    var binary = require_binary();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var schema$2 = require_schema3();
    var set = require_set();
    var timestamp = require_timestamp();
    var schemas = /* @__PURE__ */ new Map([
      ["core", schema.schema],
      ["failsafe", [map.map, seq.seq, string.string]],
      ["json", schema$1.schema],
      ["yaml11", schema$2.schema],
      ["yaml-1.1", schema$2.schema]
    ]);
    var tagsByName = {
      binary: binary.binary,
      bool: bool.boolTag,
      float: float.float,
      floatExp: float.floatExp,
      floatNaN: float.floatNaN,
      floatTime: timestamp.floatTime,
      int: int.int,
      intHex: int.intHex,
      intOct: int.intOct,
      intTime: timestamp.intTime,
      map: map.map,
      merge: merge.merge,
      null: _null.nullTag,
      omap: omap.omap,
      pairs: pairs.pairs,
      seq: seq.seq,
      set: set.set,
      timestamp: timestamp.timestamp
    };
    var coreKnownTags = {
      "tag:yaml.org,2002:binary": binary.binary,
      "tag:yaml.org,2002:merge": merge.merge,
      "tag:yaml.org,2002:omap": omap.omap,
      "tag:yaml.org,2002:pairs": pairs.pairs,
      "tag:yaml.org,2002:set": set.set,
      "tag:yaml.org,2002:timestamp": timestamp.timestamp
    };
    function getTags(customTags, schemaName, addMergeTag) {
      const schemaTags = schemas.get(schemaName);
      if (schemaTags && !customTags) {
        return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
      }
      let tags = schemaTags;
      if (!tags) {
        if (Array.isArray(customTags))
          tags = [];
        else {
          const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
        }
      }
      if (Array.isArray(customTags)) {
        for (const tag of customTags)
          tags = tags.concat(tag);
      } else if (typeof customTags === "function") {
        tags = customTags(tags.slice());
      }
      if (addMergeTag)
        tags = tags.concat(merge.merge);
      return tags.reduce((tags2, tag) => {
        const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
        if (!tagObj) {
          const tagName = JSON.stringify(tag);
          const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
        }
        if (!tags2.includes(tagObj))
          tags2.push(tagObj);
        return tags2;
      }, []);
    }
    exports.coreKnownTags = coreKnownTags;
    exports.getTags = getTags;
  }
});

// node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS({
  "node_modules/yaml/dist/schema/Schema.js"(exports) {
    "use strict";
    var identity = require_identity();
    var map = require_map();
    var seq = require_seq();
    var string = require_string();
    var tags = require_tags();
    var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    var Schema = class _Schema {
      constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
        this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
        this.name = typeof schema === "string" && schema || "core";
        this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
        this.tags = tags.getTags(customTags, this.name, merge);
        this.toStringOptions = toStringDefaults ?? null;
        Object.defineProperty(this, identity.MAP, { value: map.map });
        Object.defineProperty(this, identity.SCALAR, { value: string.string });
        Object.defineProperty(this, identity.SEQ, { value: seq.seq });
        this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
      }
      clone() {
        const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
        copy.tags = this.tags.slice();
        return copy;
      }
    };
    exports.Schema = Schema;
  }
});

// node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyDocument.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyDocument(doc, options) {
      const lines2 = [];
      let hasDirectives = options.directives === true;
      if (options.directives !== false && doc.directives) {
        const dir = doc.directives.toString(doc);
        if (dir) {
          lines2.push(dir);
          hasDirectives = true;
        } else if (doc.directives.docStart)
          hasDirectives = true;
      }
      if (hasDirectives)
        lines2.push("---");
      const ctx = stringify.createStringifyContext(doc, options);
      const { commentString } = ctx.options;
      if (doc.commentBefore) {
        if (lines2.length !== 1)
          lines2.unshift("");
        const cs = commentString(doc.commentBefore);
        lines2.unshift(stringifyComment.indentComment(cs, ""));
      }
      let chompKeep = false;
      let contentComment = null;
      if (doc.contents) {
        if (identity.isNode(doc.contents)) {
          if (doc.contents.spaceBefore && hasDirectives)
            lines2.push("");
          if (doc.contents.commentBefore) {
            const cs = commentString(doc.contents.commentBefore);
            lines2.push(stringifyComment.indentComment(cs, ""));
          }
          ctx.forceBlockIndent = !!doc.comment;
          contentComment = doc.contents.comment;
        }
        const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
        let body = stringify.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
        if (contentComment)
          body += stringifyComment.lineComment(body, "", commentString(contentComment));
        if ((body[0] === "|" || body[0] === ">") && lines2[lines2.length - 1] === "---") {
          lines2[lines2.length - 1] = `--- ${body}`;
        } else
          lines2.push(body);
      } else {
        lines2.push(stringify.stringify(doc.contents, ctx));
      }
      if (doc.directives?.docEnd) {
        if (doc.comment) {
          const cs = commentString(doc.comment);
          if (cs.includes("\n")) {
            lines2.push("...");
            lines2.push(stringifyComment.indentComment(cs, ""));
          } else {
            lines2.push(`... ${cs}`);
          }
        } else {
          lines2.push("...");
        }
      } else {
        let dc = doc.comment;
        if (dc && chompKeep)
          dc = dc.replace(/^\n+/, "");
        if (dc) {
          if ((!chompKeep || contentComment) && lines2[lines2.length - 1] !== "")
            lines2.push("");
          lines2.push(stringifyComment.indentComment(commentString(dc), ""));
        }
      }
      return lines2.join("\n") + "\n";
    }
    exports.stringifyDocument = stringifyDocument;
  }
});

// node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS({
  "node_modules/yaml/dist/doc/Document.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var toJS = require_toJS();
    var Schema = require_Schema();
    var stringifyDocument = require_stringifyDocument();
    var anchors = require_anchors();
    var applyReviver = require_applyReviver();
    var createNode = require_createNode();
    var directives = require_directives();
    var Document = class _Document {
      constructor(value, replacer, options) {
        this.commentBefore = null;
        this.comment = null;
        this.errors = [];
        this.warnings = [];
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
        let _replacer = null;
        if (typeof replacer === "function" || Array.isArray(replacer)) {
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const opt = Object.assign({
          intAsBigInt: false,
          keepSourceTokens: false,
          logLevel: "warn",
          prettyErrors: true,
          strict: true,
          stringKeys: false,
          uniqueKeys: true,
          version: "1.2"
        }, options);
        this.options = opt;
        let { version } = opt;
        if (options?._directives) {
          this.directives = options._directives.atDocument();
          if (this.directives.yaml.explicit)
            version = this.directives.yaml.version;
        } else
          this.directives = new directives.Directives({ version });
        this.setSchema(version, options);
        this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
      }
      /**
       * Create a deep copy of this Document and its contents.
       *
       * Custom Node values that inherit from `Object` still refer to their original instances.
       */
      clone() {
        const copy = Object.create(_Document.prototype, {
          [identity.NODE_TYPE]: { value: identity.DOC }
        });
        copy.commentBefore = this.commentBefore;
        copy.comment = this.comment;
        copy.errors = this.errors.slice();
        copy.warnings = this.warnings.slice();
        copy.options = Object.assign({}, this.options);
        if (this.directives)
          copy.directives = this.directives.clone();
        copy.schema = this.schema.clone();
        copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** Adds a value to the document. */
      add(value) {
        if (assertCollection(this.contents))
          this.contents.add(value);
      }
      /** Adds a value to the document. */
      addIn(path11, value) {
        if (assertCollection(this.contents))
          this.contents.addIn(path11, value);
      }
      /**
       * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
       *
       * If `node` already has an anchor, `name` is ignored.
       * Otherwise, the `node.anchor` value will be set to `name`,
       * or if an anchor with that name is already present in the document,
       * `name` will be used as a prefix for a new unique anchor.
       * If `name` is undefined, the generated anchor will use 'a' as a prefix.
       */
      createAlias(node, name) {
        if (!node.anchor) {
          const prev = anchors.anchorNames(this);
          node.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
        }
        return new Alias.Alias(node.anchor);
      }
      createNode(value, replacer, options) {
        let _replacer = void 0;
        if (typeof replacer === "function") {
          value = replacer.call({ "": value }, "", value);
          _replacer = replacer;
        } else if (Array.isArray(replacer)) {
          const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
          const asStr = replacer.filter(keyToStr).map(String);
          if (asStr.length > 0)
            replacer = replacer.concat(asStr);
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
        const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(
          this,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          anchorPrefix || "a"
        );
        const ctx = {
          aliasDuplicateObjects: aliasDuplicateObjects ?? true,
          keepUndefined: keepUndefined ?? false,
          onAnchor,
          onTagObj,
          replacer: _replacer,
          schema: this.schema,
          sourceObjects
        };
        const node = createNode.createNode(value, tag, ctx);
        if (flow && identity.isCollection(node))
          node.flow = true;
        setAnchors();
        return node;
      }
      /**
       * Convert a key and a value into a `Pair` using the current schema,
       * recursively wrapping all values as `Scalar` or `Collection` nodes.
       */
      createPair(key, value, options = {}) {
        const k = this.createNode(key, null, options);
        const v = this.createNode(value, null, options);
        return new Pair.Pair(k, v);
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        return assertCollection(this.contents) ? this.contents.delete(key) : false;
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path11) {
        if (Collection.isEmptyPath(path11)) {
          if (this.contents == null)
            return false;
          this.contents = null;
          return true;
        }
        return assertCollection(this.contents) ? this.contents.deleteIn(path11) : false;
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      get(key, keepScalar) {
        return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
      }
      /**
       * Returns item at `path`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path11, keepScalar) {
        if (Collection.isEmptyPath(path11))
          return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
        return identity.isCollection(this.contents) ? this.contents.getIn(path11, keepScalar) : void 0;
      }
      /**
       * Checks if the document includes a value with the key `key`.
       */
      has(key) {
        return identity.isCollection(this.contents) ? this.contents.has(key) : false;
      }
      /**
       * Checks if the document includes a value at `path`.
       */
      hasIn(path11) {
        if (Collection.isEmptyPath(path11))
          return this.contents !== void 0;
        return identity.isCollection(this.contents) ? this.contents.hasIn(path11) : false;
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      set(key, value) {
        if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, [key], value);
        } else if (assertCollection(this.contents)) {
          this.contents.set(key, value);
        }
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path11, value) {
        if (Collection.isEmptyPath(path11)) {
          this.contents = value;
        } else if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, Array.from(path11), value);
        } else if (assertCollection(this.contents)) {
          this.contents.setIn(path11, value);
        }
      }
      /**
       * Change the YAML version and schema used by the document.
       * A `null` version disables support for directives, explicit tags, anchors, and aliases.
       * It also requires the `schema` option to be given as a `Schema` instance value.
       *
       * Overrides all previously set schema options.
       */
      setSchema(version, options = {}) {
        if (typeof version === "number")
          version = String(version);
        let opt;
        switch (version) {
          case "1.1":
            if (this.directives)
              this.directives.yaml.version = "1.1";
            else
              this.directives = new directives.Directives({ version: "1.1" });
            opt = { resolveKnownTags: false, schema: "yaml-1.1" };
            break;
          case "1.2":
          case "next":
            if (this.directives)
              this.directives.yaml.version = version;
            else
              this.directives = new directives.Directives({ version });
            opt = { resolveKnownTags: true, schema: "core" };
            break;
          case null:
            if (this.directives)
              delete this.directives;
            opt = null;
            break;
          default: {
            const sv = JSON.stringify(version);
            throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
          }
        }
        if (options.schema instanceof Object)
          this.schema = options.schema;
        else if (opt)
          this.schema = new Schema.Schema(Object.assign(opt, options));
        else
          throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
      }
      // json & jsonArg are only used from toJSON()
      toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc: this,
          keep: !json,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
      /**
       * A JSON representation of the document `contents`.
       *
       * @param jsonArg Used by `JSON.stringify` to indicate the array index or
       *   property name.
       */
      toJSON(jsonArg, onAnchor) {
        return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
      }
      /** A YAML representation of the document. */
      toString(options = {}) {
        if (this.errors.length > 0)
          throw new Error("Document with errors cannot be stringified");
        if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
          const s = JSON.stringify(options.indent);
          throw new Error(`"indent" option must be a positive integer, not ${s}`);
        }
        return stringifyDocument.stringifyDocument(this, options);
      }
    };
    function assertCollection(contents) {
      if (identity.isCollection(contents))
        return true;
      throw new Error("Expected a YAML collection as document contents");
    }
    exports.Document = Document;
  }
});

// node_modules/yaml/dist/errors.js
var require_errors = __commonJS({
  "node_modules/yaml/dist/errors.js"(exports) {
    "use strict";
    var YAMLError = class extends Error {
      constructor(name, pos, code, message) {
        super();
        this.name = name;
        this.code = code;
        this.message = message;
        this.pos = pos;
      }
    };
    var YAMLParseError = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLParseError", pos, code, message);
      }
    };
    var YAMLWarning = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLWarning", pos, code, message);
      }
    };
    var prettifyError = (src, lc2) => (error) => {
      if (error.pos[0] === -1)
        return;
      error.linePos = error.pos.map((pos) => lc2.linePos(pos));
      const { line, col } = error.linePos[0];
      error.message += ` at line ${line}, column ${col}`;
      let ci = col - 1;
      let lineStr = src.substring(lc2.lineStarts[line - 1], lc2.lineStarts[line]).replace(/[\n\r]+$/, "");
      if (ci >= 60 && lineStr.length > 80) {
        const trimStart = Math.min(ci - 39, lineStr.length - 79);
        lineStr = "\u2026" + lineStr.substring(trimStart);
        ci -= trimStart - 1;
      }
      if (lineStr.length > 80)
        lineStr = lineStr.substring(0, 79) + "\u2026";
      if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
        let prev = src.substring(lc2.lineStarts[line - 2], lc2.lineStarts[line - 1]);
        if (prev.length > 80)
          prev = prev.substring(0, 79) + "\u2026\n";
        lineStr = prev + lineStr;
      }
      if (/[^ ]/.test(lineStr)) {
        let count = 1;
        const end = error.linePos[1];
        if (end?.line === line && end.col > col) {
          count = Math.max(1, Math.min(end.col - col, 80 - ci));
        }
        const pointer = " ".repeat(ci) + "^".repeat(count);
        error.message += `:

${lineStr}
${pointer}
`;
      }
    };
    exports.YAMLError = YAMLError;
    exports.YAMLParseError = YAMLParseError;
    exports.YAMLWarning = YAMLWarning;
    exports.prettifyError = prettifyError;
  }
});

// node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS({
  "node_modules/yaml/dist/compose/resolve-props.js"(exports) {
    "use strict";
    function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
      let spaceBefore = false;
      let atNewline = startOnNewline;
      let hasSpace = startOnNewline;
      let comment = "";
      let commentSep = "";
      let hasNewline = false;
      let reqSpace = false;
      let tab = null;
      let anchor = null;
      let tag = null;
      let newlineAfterProp = null;
      let comma = null;
      let found = null;
      let start = null;
      for (const token of tokens) {
        if (reqSpace) {
          if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
            onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
          reqSpace = false;
        }
        if (tab) {
          if (atNewline && token.type !== "comment" && token.type !== "newline") {
            onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
          }
          tab = null;
        }
        switch (token.type) {
          case "space":
            if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) {
              tab = token;
            }
            hasSpace = true;
            break;
          case "comment": {
            if (!hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = token.source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += commentSep + cb;
            commentSep = "";
            atNewline = false;
            break;
          }
          case "newline":
            if (atNewline) {
              if (comment)
                comment += token.source;
              else if (!found || indicator !== "seq-item-ind")
                spaceBefore = true;
            } else
              commentSep += token.source;
            atNewline = true;
            hasNewline = true;
            if (anchor || tag)
              newlineAfterProp = token;
            hasSpace = true;
            break;
          case "anchor":
            if (anchor)
              onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
            if (token.source.endsWith(":"))
              onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
            anchor = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          case "tag": {
            if (tag)
              onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
            tag = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          }
          case indicator:
            if (anchor || tag)
              onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
            if (found)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
            found = token;
            atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
            hasSpace = false;
            break;
          case "comma":
            if (flow) {
              if (comma)
                onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
              comma = token;
              atNewline = false;
              hasSpace = false;
              break;
            }
          // else fallthrough
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
            atNewline = false;
            hasSpace = false;
        }
      }
      const last = tokens[tokens.length - 1];
      const end = last ? last.offset + last.source.length : offset;
      if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
        onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
      }
      if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
        onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
      return {
        comma,
        found,
        spaceBefore,
        comment,
        hasNewline,
        anchor,
        tag,
        newlineAfterProp,
        end,
        start: start ?? end
      };
    }
    exports.resolveProps = resolveProps;
  }
});

// node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS({
  "node_modules/yaml/dist/compose/util-contains-newline.js"(exports) {
    "use strict";
    function containsNewline(key) {
      if (!key)
        return null;
      switch (key.type) {
        case "alias":
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          if (key.source.includes("\n"))
            return true;
          if (key.end) {
            for (const st of key.end)
              if (st.type === "newline")
                return true;
          }
          return false;
        case "flow-collection":
          for (const it of key.items) {
            for (const st of it.start)
              if (st.type === "newline")
                return true;
            if (it.sep) {
              for (const st of it.sep)
                if (st.type === "newline")
                  return true;
            }
            if (containsNewline(it.key) || containsNewline(it.value))
              return true;
          }
          return false;
        default:
          return true;
      }
    }
    exports.containsNewline = containsNewline;
  }
});

// node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS({
  "node_modules/yaml/dist/compose/util-flow-indent-check.js"(exports) {
    "use strict";
    var utilContainsNewline = require_util_contains_newline();
    function flowIndentCheck(indent, fc, onError) {
      if (fc?.type === "flow-collection") {
        const end = fc.end[0];
        if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
          const msg = "Flow end indicator should be more indented than parent";
          onError(end, "BAD_INDENT", msg, true);
        }
      }
    }
    exports.flowIndentCheck = flowIndentCheck;
  }
});

// node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS({
  "node_modules/yaml/dist/compose/util-map-includes.js"(exports) {
    "use strict";
    var identity = require_identity();
    function mapIncludes(ctx, items, search) {
      const { uniqueKeys } = ctx.options;
      if (uniqueKeys === false)
        return false;
      const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value;
      return items.some((pair) => isEqual(pair.key, search));
    }
    exports.mapIncludes = mapIncludes;
  }
});

// node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-map.js"(exports) {
    "use strict";
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    var utilMapIncludes = require_util_map_includes();
    var startColMsg = "All mapping items must start at the same column";
    function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
      const map = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      let offset = bm.offset;
      let commentEnd = null;
      for (const collItem of bm.items) {
        const { start, key, sep: sep2, value } = collItem;
        const keyProps = resolveProps.resolveProps(start, {
          indicator: "explicit-key-ind",
          next: key ?? sep2?.[0],
          offset,
          onError,
          parentIndent: bm.indent,
          startOnNewline: true
        });
        const implicitKey = !keyProps.found;
        if (implicitKey) {
          if (key) {
            if (key.type === "block-seq")
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
            else if ("indent" in key && key.indent !== bm.indent)
              onError(offset, "BAD_INDENT", startColMsg);
          }
          if (!keyProps.anchor && !keyProps.tag && !sep2) {
            commentEnd = keyProps.end;
            if (keyProps.comment) {
              if (map.comment)
                map.comment += "\n" + keyProps.comment;
              else
                map.comment = keyProps.comment;
            }
            continue;
          }
          if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
            onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
          }
        } else if (keyProps.found?.indent !== bm.indent) {
          onError(offset, "BAD_INDENT", startColMsg);
        }
        ctx.atKey = true;
        const keyStart = keyProps.end;
        const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
        ctx.atKey = false;
        if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
          onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
        const valueProps = resolveProps.resolveProps(sep2 ?? [], {
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: bm.indent,
          startOnNewline: !key || key.type === "block-scalar"
        });
        offset = valueProps.end;
        if (valueProps.found) {
          if (implicitKey) {
            if (value?.type === "block-map" && !valueProps.hasNewline)
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
            if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
              onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep2, null, valueProps, onError);
          if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
          offset = valueNode.range[2];
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        } else {
          if (implicitKey)
            onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
          if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        }
      }
      if (commentEnd && commentEnd < offset)
        onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
      map.range = [bm.offset, offset, commentEnd ?? offset];
      return map;
    }
    exports.resolveBlockMap = resolveBlockMap;
  }
});

// node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-seq.js"(exports) {
    "use strict";
    var YAMLSeq = require_YAMLSeq();
    var resolveProps = require_resolve_props();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
      const seq = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = bs.offset;
      let commentEnd = null;
      for (const { start, value } of bs.items) {
        const props = resolveProps.resolveProps(start, {
          indicator: "seq-item-ind",
          next: value,
          offset,
          onError,
          parentIndent: bs.indent,
          startOnNewline: true
        });
        if (!props.found) {
          if (props.anchor || props.tag || value) {
            if (value?.type === "block-seq")
              onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
            else
              onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
          } else {
            commentEnd = props.end;
            if (props.comment)
              seq.comment = props.comment;
            continue;
          }
        }
        const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
        offset = node.range[2];
        seq.items.push(node);
      }
      seq.range = [bs.offset, offset, commentEnd ?? offset];
      return seq;
    }
    exports.resolveBlockSeq = resolveBlockSeq;
  }
});

// node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS({
  "node_modules/yaml/dist/compose/resolve-end.js"(exports) {
    "use strict";
    function resolveEnd(end, offset, reqSpace, onError) {
      let comment = "";
      if (end) {
        let hasSpace = false;
        let sep2 = "";
        for (const token of end) {
          const { source, type } = token;
          switch (type) {
            case "space":
              hasSpace = true;
              break;
            case "comment": {
              if (reqSpace && !hasSpace)
                onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
              const cb = source.substring(1) || " ";
              if (!comment)
                comment = cb;
              else
                comment += sep2 + cb;
              sep2 = "";
              break;
            }
            case "newline":
              if (comment)
                sep2 += source;
              hasSpace = true;
              break;
            default:
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
          }
          offset += source.length;
        }
      }
      return { comment, offset };
    }
    exports.resolveEnd = resolveEnd;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilMapIncludes = require_util_map_includes();
    var blockMsg = "Block collections are not allowed within flow collections";
    var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
    function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
      const isMap = fc.start.source === "{";
      const fcName = isMap ? "flow map" : "flow sequence";
      const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
      const coll = new NodeClass(ctx.schema);
      coll.flow = true;
      const atRoot = ctx.atRoot;
      if (atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = fc.offset + fc.start.source.length;
      for (let i = 0; i < fc.items.length; ++i) {
        const collItem = fc.items[i];
        const { start, key, sep: sep2, value } = collItem;
        const props = resolveProps.resolveProps(start, {
          flow: fcName,
          indicator: "explicit-key-ind",
          next: key ?? sep2?.[0],
          offset,
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (!props.found) {
          if (!props.anchor && !props.tag && !sep2 && !value) {
            if (i === 0 && props.comma)
              onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
            else if (i < fc.items.length - 1)
              onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
            if (props.comment) {
              if (coll.comment)
                coll.comment += "\n" + props.comment;
              else
                coll.comment = props.comment;
            }
            offset = props.end;
            continue;
          }
          if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
            onError(
              key,
              // checked by containsNewline()
              "MULTILINE_IMPLICIT_KEY",
              "Implicit keys of flow sequence pairs need to be on a single line"
            );
        }
        if (i === 0) {
          if (props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
        } else {
          if (!props.comma)
            onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
          if (props.comment) {
            let prevItemComment = "";
            loop: for (const st of start) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
            if (prevItemComment) {
              let prev = coll.items[coll.items.length - 1];
              if (identity.isPair(prev))
                prev = prev.value ?? prev.key;
              if (prev.comment)
                prev.comment += "\n" + prevItemComment;
              else
                prev.comment = prevItemComment;
              props.comment = props.comment.substring(prevItemComment.length + 1);
            }
          }
        }
        if (!isMap && !sep2 && !props.found) {
          const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep2, null, props, onError);
          coll.items.push(valueNode);
          offset = valueNode.range[2];
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else {
          ctx.atKey = true;
          const keyStart = props.end;
          const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
          if (isBlock(key))
            onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
          ctx.atKey = false;
          const valueProps = resolveProps.resolveProps(sep2 ?? [], {
            flow: fcName,
            indicator: "map-value-ind",
            next: value,
            offset: keyNode.range[2],
            onError,
            parentIndent: fc.indent,
            startOnNewline: false
          });
          if (valueProps.found) {
            if (!isMap && !props.found && ctx.options.strict) {
              if (sep2)
                for (const st of sep2) {
                  if (st === valueProps.found)
                    break;
                  if (st.type === "newline") {
                    onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                    break;
                  }
                }
              if (props.start < valueProps.found.offset - 1024)
                onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
            }
          } else if (value) {
            if ("source" in value && value.source?.[0] === ":")
              onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
            else
              onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep2, null, valueProps, onError) : null;
          if (valueNode) {
            if (isBlock(value))
              onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
          } else if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          if (isMap) {
            const map = coll;
            if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
              onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
            map.items.push(pair);
          } else {
            const map = new YAMLMap.YAMLMap(ctx.schema);
            map.flow = true;
            map.items.push(pair);
            const endRange = (valueNode ?? keyNode).range;
            map.range = [keyNode.range[0], endRange[1], endRange[2]];
            coll.items.push(map);
          }
          offset = valueNode ? valueNode.range[2] : valueProps.end;
        }
      }
      const expectedEnd = isMap ? "}" : "]";
      const [ce, ...ee] = fc.end;
      let cePos = offset;
      if (ce?.source === expectedEnd)
        cePos = ce.offset + ce.source.length;
      else {
        const name = fcName[0].toUpperCase() + fcName.substring(1);
        const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
        onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
        if (ce && ce.source.length !== 1)
          ee.unshift(ce);
      }
      if (ee.length > 0) {
        const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
        if (end.comment) {
          if (coll.comment)
            coll.comment += "\n" + end.comment;
          else
            coll.comment = end.comment;
        }
        coll.range = [fc.offset, cePos, end.offset];
      } else {
        coll.range = [fc.offset, cePos, cePos];
      }
      return coll;
    }
    exports.resolveFlowCollection = resolveFlowCollection;
  }
});

// node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS({
  "node_modules/yaml/dist/compose/compose-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveBlockMap = require_resolve_block_map();
    var resolveBlockSeq = require_resolve_block_seq();
    var resolveFlowCollection = require_resolve_flow_collection();
    function resolveCollection(CN, ctx, token, onError, tagName, tag) {
      const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
      const Coll = coll.constructor;
      if (tagName === "!" || tagName === Coll.tagName) {
        coll.tag = Coll.tagName;
        return coll;
      }
      if (tagName)
        coll.tag = tagName;
      return coll;
    }
    function composeCollection(CN, ctx, token, props, onError) {
      const tagToken = props.tag;
      const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
      if (token.type === "block-seq") {
        const { anchor, newlineAfterProp: nl } = props;
        const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
        if (lastProp && (!nl || nl.offset < lastProp.offset)) {
          const message = "Missing newline after block sequence props";
          onError(lastProp, "MISSING_CHAR", message);
        }
      }
      const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
      if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
      let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
      if (!tag) {
        const kt = ctx.schema.knownTags[tagName];
        if (kt?.collection === expType) {
          ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
          tag = kt;
        } else {
          if (kt) {
            onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
          } else {
            onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
          }
          return resolveCollection(CN, ctx, token, onError, tagName);
        }
      }
      const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
      const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
      const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
      node.range = coll.range;
      node.tag = tagName;
      if (tag?.format)
        node.format = tag.format;
      return node;
    }
    exports.composeCollection = composeCollection;
  }
});

// node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function resolveBlockScalar(ctx, scalar, onError) {
      const start = scalar.offset;
      const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
      if (!header)
        return { value: "", type: null, comment: "", range: [start, start, start] };
      const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
      const lines2 = scalar.source ? splitLines(scalar.source) : [];
      let chompStart = lines2.length;
      for (let i = lines2.length - 1; i >= 0; --i) {
        const content = lines2[i][1];
        if (content === "" || content === "\r")
          chompStart = i;
        else
          break;
      }
      if (chompStart === 0) {
        const value2 = header.chomp === "+" && lines2.length > 0 ? "\n".repeat(Math.max(1, lines2.length - 1)) : "";
        let end2 = start + header.length;
        if (scalar.source)
          end2 += scalar.source.length;
        return { value: value2, type, comment: header.comment, range: [start, end2, end2] };
      }
      let trimIndent = scalar.indent + header.indent;
      let offset = scalar.offset + header.length;
      let contentStart = 0;
      for (let i = 0; i < chompStart; ++i) {
        const [indent, content] = lines2[i];
        if (content === "" || content === "\r") {
          if (header.indent === 0 && indent.length > trimIndent)
            trimIndent = indent.length;
        } else {
          if (indent.length < trimIndent) {
            const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
            onError(offset + indent.length, "MISSING_CHAR", message);
          }
          if (header.indent === 0)
            trimIndent = indent.length;
          contentStart = i;
          if (trimIndent === 0 && !ctx.atRoot) {
            const message = "Block scalar values in collections must be indented";
            onError(offset, "BAD_INDENT", message);
          }
          break;
        }
        offset += indent.length + content.length + 1;
      }
      for (let i = lines2.length - 1; i >= chompStart; --i) {
        if (lines2[i][0].length > trimIndent)
          chompStart = i + 1;
      }
      let value = "";
      let sep2 = "";
      let prevMoreIndented = false;
      for (let i = 0; i < contentStart; ++i)
        value += lines2[i][0].slice(trimIndent) + "\n";
      for (let i = contentStart; i < chompStart; ++i) {
        let [indent, content] = lines2[i];
        offset += indent.length + content.length + 1;
        const crlf = content[content.length - 1] === "\r";
        if (crlf)
          content = content.slice(0, -1);
        if (content && indent.length < trimIndent) {
          const src = header.indent ? "explicit indentation indicator" : "first line";
          const message = `Block scalar lines must not be less indented than their ${src}`;
          onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
          indent = "";
        }
        if (type === Scalar.Scalar.BLOCK_LITERAL) {
          value += sep2 + indent.slice(trimIndent) + content;
          sep2 = "\n";
        } else if (indent.length > trimIndent || content[0] === "	") {
          if (sep2 === " ")
            sep2 = "\n";
          else if (!prevMoreIndented && sep2 === "\n")
            sep2 = "\n\n";
          value += sep2 + indent.slice(trimIndent) + content;
          sep2 = "\n";
          prevMoreIndented = true;
        } else if (content === "") {
          if (sep2 === "\n")
            value += "\n";
          else
            sep2 = "\n";
        } else {
          value += sep2 + content;
          sep2 = " ";
          prevMoreIndented = false;
        }
      }
      switch (header.chomp) {
        case "-":
          break;
        case "+":
          for (let i = chompStart; i < lines2.length; ++i)
            value += "\n" + lines2[i][0].slice(trimIndent);
          if (value[value.length - 1] !== "\n")
            value += "\n";
          break;
        default:
          value += "\n";
      }
      const end = start + header.length + scalar.source.length;
      return { value, type, comment: header.comment, range: [start, end, end] };
    }
    function parseBlockScalarHeader({ offset, props }, strict, onError) {
      if (props[0].type !== "block-scalar-header") {
        onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
        return null;
      }
      const { source } = props[0];
      const mode = source[0];
      let indent = 0;
      let chomp = "";
      let error = -1;
      for (let i = 1; i < source.length; ++i) {
        const ch = source[i];
        if (!chomp && (ch === "-" || ch === "+"))
          chomp = ch;
        else {
          const n = Number(ch);
          if (!indent && n)
            indent = n;
          else if (error === -1)
            error = offset + i;
        }
      }
      if (error !== -1)
        onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
      let hasSpace = false;
      let comment = "";
      let length = source.length;
      for (let i = 1; i < props.length; ++i) {
        const token = props[i];
        switch (token.type) {
          case "space":
            hasSpace = true;
          // fallthrough
          case "newline":
            length += token.source.length;
            break;
          case "comment":
            if (strict && !hasSpace) {
              const message = "Comments must be separated from other tokens by white space characters";
              onError(token, "MISSING_CHAR", message);
            }
            length += token.source.length;
            comment = token.source.substring(1);
            break;
          case "error":
            onError(token, "UNEXPECTED_TOKEN", token.message);
            length += token.source.length;
            break;
          /* istanbul ignore next should not happen */
          default: {
            const message = `Unexpected token in block scalar header: ${token.type}`;
            onError(token, "UNEXPECTED_TOKEN", message);
            const ts = token.source;
            if (ts && typeof ts === "string")
              length += ts.length;
          }
        }
      }
      return { mode, indent, chomp, comment, length };
    }
    function splitLines(source) {
      const split = source.split(/\n( *)/);
      const first = split[0];
      const m = first.match(/^( *)/);
      const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
      const lines2 = [line0];
      for (let i = 1; i < split.length; i += 2)
        lines2.push([split[i], split[i + 1]]);
      return lines2;
    }
    exports.resolveBlockScalar = resolveBlockScalar;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var resolveEnd = require_resolve_end();
    function resolveFlowScalar(scalar, strict, onError) {
      const { offset, type, source, end } = scalar;
      let _type;
      let value;
      const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
      switch (type) {
        case "scalar":
          _type = Scalar.Scalar.PLAIN;
          value = plainValue(source, _onError);
          break;
        case "single-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_SINGLE;
          value = singleQuotedValue(source, _onError);
          break;
        case "double-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_DOUBLE;
          value = doubleQuotedValue(source, _onError);
          break;
        /* istanbul ignore next should not happen */
        default:
          onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
          return {
            value: "",
            type: null,
            comment: "",
            range: [offset, offset + source.length, offset + source.length]
          };
      }
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
      return {
        value,
        type: _type,
        comment: re.comment,
        range: [offset, valueEnd, re.offset]
      };
    }
    function plainValue(source, onError) {
      let badChar = "";
      switch (source[0]) {
        /* istanbul ignore next should not happen */
        case "	":
          badChar = "a tab character";
          break;
        case ",":
          badChar = "flow indicator character ,";
          break;
        case "%":
          badChar = "directive indicator character %";
          break;
        case "|":
        case ">": {
          badChar = `block scalar indicator ${source[0]}`;
          break;
        }
        case "@":
        case "`": {
          badChar = `reserved character ${source[0]}`;
          break;
        }
      }
      if (badChar)
        onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
      return unfoldLines(source);
    }
    function singleQuotedValue(source, onError) {
      if (source[source.length - 1] !== "'" || source.length === 1)
        onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
      return unfoldLines(source.slice(1, -1)).replace(/''/g, "'");
    }
    function unfoldLines(source) {
      const line = /(.*?)\r?\n/sy;
      let match = line.exec(source);
      if (!match)
        return source;
      let trimEnd, trimBoth;
      try {
        trimEnd = new RegExp("(?<![ 	])[ 	]+$");
        trimBoth = new RegExp("^[ 	]+|(?<![ 	])[ 	]+$", "g");
      } catch {
        trimEnd = /[ \t]+$/;
        trimBoth = /^[ \t]+|[ \t]+$/g;
      }
      let res = match[1].replace(trimEnd, "");
      let sep2 = " ";
      let pos = line.lastIndex;
      while (match = line.exec(source)) {
        const lm = match[1].replace(trimBoth, "");
        if (lm === "") {
          if (sep2 === "\n")
            res += sep2;
          else
            sep2 = "\n";
        } else {
          res += sep2 + lm;
          sep2 = " ";
        }
        pos = line.lastIndex;
      }
      const last = /[ \t]*(.*)/sy;
      last.lastIndex = pos;
      match = last.exec(source);
      return res + sep2 + (match?.[1] ?? "");
    }
    function doubleQuotedValue(source, onError) {
      let res = "";
      for (let i = 1; i < source.length - 1; ++i) {
        const ch = source[i];
        if (ch === "\r" && source[i + 1] === "\n")
          continue;
        if (ch === "\n") {
          const { fold, offset } = foldNewline(source, i);
          res += fold;
          i = offset;
        } else if (ch === "\\") {
          let next = source[++i];
          const cc = escapeCodes[next];
          if (cc)
            res += cc;
          else if (next === "\n") {
            next = source[i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "\r" && source[i + 1] === "\n") {
            next = source[++i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "x" || next === "u" || next === "U") {
            const length = next === "x" ? 2 : next === "u" ? 4 : 8;
            res += parseCharCode(source, i + 1, length, onError);
            i += length;
          } else {
            const raw = source.substr(i - 1, 2);
            onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
            res += raw;
          }
        } else if (ch === " " || ch === "	") {
          const wsStart = i;
          let next = source[i + 1];
          while (next === " " || next === "	")
            next = source[++i + 1];
          if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n"))
            res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
        } else {
          res += ch;
        }
      }
      if (source[source.length - 1] !== '"' || source.length === 1)
        onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
      return res;
    }
    function foldNewline(source, offset) {
      let fold = "";
      let ch = source[offset + 1];
      while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
        if (ch === "\r" && source[offset + 2] !== "\n")
          break;
        if (ch === "\n")
          fold += "\n";
        offset += 1;
        ch = source[offset + 1];
      }
      if (!fold)
        fold = " ";
      return { fold, offset };
    }
    var escapeCodes = {
      "0": "\0",
      // null character
      a: "\x07",
      // bell character
      b: "\b",
      // backspace
      e: "\x1B",
      // escape character
      f: "\f",
      // form feed
      n: "\n",
      // line feed
      r: "\r",
      // carriage return
      t: "	",
      // horizontal tab
      v: "\v",
      // vertical tab
      N: "\x85",
      // Unicode next line
      _: "\xA0",
      // Unicode non-breaking space
      L: "\u2028",
      // Unicode line separator
      P: "\u2029",
      // Unicode paragraph separator
      " ": " ",
      '"': '"',
      "/": "/",
      "\\": "\\",
      "	": "	"
    };
    function parseCharCode(source, offset, length, onError) {
      const cc = source.substr(offset, length);
      const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
      const code = ok ? parseInt(cc, 16) : NaN;
      try {
        return String.fromCodePoint(code);
      } catch {
        const raw = source.substr(offset - 2, length + 2);
        onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
        return raw;
      }
    }
    exports.resolveFlowScalar = resolveFlowScalar;
  }
});

// node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS({
  "node_modules/yaml/dist/compose/compose-scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    function composeScalar(ctx, token, tagToken, onError) {
      const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
      const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
      let tag;
      if (ctx.options.stringKeys && ctx.atKey) {
        tag = ctx.schema[identity.SCALAR];
      } else if (tagName)
        tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
      else if (token.type === "scalar")
        tag = findScalarTagByTest(ctx, value, token, onError);
      else
        tag = ctx.schema[identity.SCALAR];
      let scalar;
      try {
        const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
        scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
        scalar = new Scalar.Scalar(value);
      }
      scalar.range = range;
      scalar.source = value;
      if (type)
        scalar.type = type;
      if (tagName)
        scalar.tag = tagName;
      if (tag.format)
        scalar.format = tag.format;
      if (comment)
        scalar.comment = comment;
      return scalar;
    }
    function findScalarTagByName(schema, value, tagName, tagToken, onError) {
      if (tagName === "!")
        return schema[identity.SCALAR];
      const matchWithTest = [];
      for (const tag of schema.tags) {
        if (!tag.collection && tag.tag === tagName) {
          if (tag.default && tag.test)
            matchWithTest.push(tag);
          else
            return tag;
        }
      }
      for (const tag of matchWithTest)
        if (tag.test?.test(value))
          return tag;
      const kt = schema.knownTags[tagName];
      if (kt && !kt.collection) {
        schema.tags.push(Object.assign({}, kt, { default: false, test: void 0 }));
        return kt;
      }
      onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
      return schema[identity.SCALAR];
    }
    function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
      const tag = schema.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema[identity.SCALAR];
      if (schema.compat) {
        const compat = schema.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema[identity.SCALAR];
        if (tag.tag !== compat.tag) {
          const ts = directives.tagString(tag.tag);
          const cs = directives.tagString(compat.tag);
          const msg = `Value may be parsed as either ${ts} or ${cs}`;
          onError(token, "TAG_RESOLVE_FAILED", msg, true);
        }
      }
      return tag;
    }
    exports.composeScalar = composeScalar;
  }
});

// node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS({
  "node_modules/yaml/dist/compose/util-empty-scalar-position.js"(exports) {
    "use strict";
    function emptyScalarPosition(offset, before, pos) {
      if (before) {
        pos ?? (pos = before.length);
        for (let i = pos - 1; i >= 0; --i) {
          let st = before[i];
          switch (st.type) {
            case "space":
            case "comment":
            case "newline":
              offset -= st.source.length;
              continue;
          }
          st = before[++i];
          while (st?.type === "space") {
            offset += st.source.length;
            st = before[++i];
          }
          break;
        }
      }
      return offset;
    }
    exports.emptyScalarPosition = emptyScalarPosition;
  }
});

// node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS({
  "node_modules/yaml/dist/compose/compose-node.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var composeCollection = require_compose_collection();
    var composeScalar = require_compose_scalar();
    var resolveEnd = require_resolve_end();
    var utilEmptyScalarPosition = require_util_empty_scalar_position();
    var CN = { composeNode, composeEmptyNode };
    function composeNode(ctx, token, props, onError) {
      const atKey = ctx.atKey;
      const { spaceBefore, comment, anchor, tag } = props;
      let node;
      let isSrcToken = true;
      switch (token.type) {
        case "alias":
          node = composeAlias(ctx, token, onError);
          if (anchor || tag)
            onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
          break;
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "block-scalar":
          node = composeScalar.composeScalar(ctx, token, tag, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
          break;
        case "block-map":
        case "block-seq":
        case "flow-collection":
          try {
            node = composeCollection.composeCollection(CN, ctx, token, props, onError);
            if (anchor)
              node.anchor = anchor.source.substring(1);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            onError(token, "RESOURCE_EXHAUSTION", message);
          }
          break;
        default: {
          const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
          onError(token, "UNEXPECTED_TOKEN", message);
          isSrcToken = false;
        }
      }
      node ?? (node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError));
      if (anchor && node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
        const msg = "With stringKeys, all keys must be strings";
        onError(tag ?? token, "NON_STRING_KEY", msg);
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        if (token.type === "scalar" && token.source === "")
          node.comment = comment;
        else
          node.commentBefore = comment;
      }
      if (ctx.options.keepSourceTokens && isSrcToken)
        node.srcToken = token;
      return node;
    }
    function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
      const token = {
        type: "scalar",
        offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
        indent: -1,
        source: ""
      };
      const node = composeScalar.composeScalar(ctx, token, tag, onError);
      if (anchor) {
        node.anchor = anchor.source.substring(1);
        if (node.anchor === "")
          onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        node.comment = comment;
        node.range[2] = end;
      }
      return node;
    }
    function composeAlias({ options }, { offset, source, end }, onError) {
      const alias = new Alias.Alias(source.substring(1));
      if (alias.source === "")
        onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
      if (alias.source.endsWith(":"))
        onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
      alias.range = [offset, valueEnd, re.offset];
      if (re.comment)
        alias.comment = re.comment;
      return alias;
    }
    exports.composeEmptyNode = composeEmptyNode;
    exports.composeNode = composeNode;
  }
});

// node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS({
  "node_modules/yaml/dist/compose/compose-doc.js"(exports) {
    "use strict";
    var Document = require_Document();
    var composeNode = require_compose_node();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    function composeDoc(options, directives, { offset, start, value, end }, onError) {
      const opts = Object.assign({ _directives: directives }, options);
      const doc = new Document.Document(void 0, opts);
      const ctx = {
        atKey: false,
        atRoot: true,
        directives: doc.directives,
        options: doc.options,
        schema: doc.schema
      };
      const props = resolveProps.resolveProps(start, {
        indicator: "doc-start",
        next: value ?? end?.[0],
        offset,
        onError,
        parentIndent: 0,
        startOnNewline: true
      });
      if (props.found) {
        doc.directives.docStart = true;
        if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
          onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
      }
      doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
      const contentEnd = doc.contents.range[2];
      const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
      if (re.comment)
        doc.comment = re.comment;
      doc.range = [offset, contentEnd, re.offset];
      return doc;
    }
    exports.composeDoc = composeDoc;
  }
});

// node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS({
  "node_modules/yaml/dist/compose/composer.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var directives = require_directives();
    var Document = require_Document();
    var errors = require_errors();
    var identity = require_identity();
    var composeDoc = require_compose_doc();
    var resolveEnd = require_resolve_end();
    function getErrorPos(src) {
      if (typeof src === "number")
        return [src, src + 1];
      if (Array.isArray(src))
        return src.length === 2 ? src : [src[0], src[1]];
      const { offset, source } = src;
      return [offset, offset + (typeof source === "string" ? source.length : 1)];
    }
    function parsePrelude(prelude) {
      let comment = "";
      let atComment = false;
      let afterEmptyLine = false;
      for (let i = 0; i < prelude.length; ++i) {
        const source = prelude[i];
        switch (source[0]) {
          case "#":
            comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
            atComment = true;
            afterEmptyLine = false;
            break;
          case "%":
            if (prelude[i + 1]?.[0] !== "#")
              i += 1;
            atComment = false;
            break;
          default:
            if (!atComment)
              afterEmptyLine = true;
            atComment = false;
        }
      }
      return { comment, afterEmptyLine };
    }
    var Composer = class {
      constructor(options = {}) {
        this.doc = null;
        this.atDirectives = false;
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
        this.onError = (source, code, message, warning) => {
          const pos = getErrorPos(source);
          if (warning)
            this.warnings.push(new errors.YAMLWarning(pos, code, message));
          else
            this.errors.push(new errors.YAMLParseError(pos, code, message));
        };
        this.directives = new directives.Directives({ version: options.version || "1.2" });
        this.options = options;
      }
      decorate(doc, afterDoc) {
        const { comment, afterEmptyLine } = parsePrelude(this.prelude);
        if (comment) {
          const dc = doc.contents;
          if (afterDoc) {
            doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
          } else if (afterEmptyLine || doc.directives.docStart || !dc) {
            doc.commentBefore = comment;
          } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
            let it = dc.items[0];
            if (identity.isPair(it))
              it = it.key;
            const cb = it.commentBefore;
            it.commentBefore = cb ? `${comment}
${cb}` : comment;
          } else {
            const cb = dc.commentBefore;
            dc.commentBefore = cb ? `${comment}
${cb}` : comment;
          }
        }
        if (afterDoc) {
          for (let i = 0; i < this.errors.length; ++i)
            doc.errors.push(this.errors[i]);
          for (let i = 0; i < this.warnings.length; ++i)
            doc.warnings.push(this.warnings[i]);
        } else {
          doc.errors = this.errors;
          doc.warnings = this.warnings;
        }
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
      }
      /**
       * Current stream status information.
       *
       * Mostly useful at the end of input for an empty stream.
       */
      streamInfo() {
        return {
          comment: parsePrelude(this.prelude).comment,
          directives: this.directives,
          errors: this.errors,
          warnings: this.warnings
        };
      }
      /**
       * Compose tokens into documents.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *compose(tokens, forceDoc = false, endOffset = -1) {
        for (const token of tokens)
          yield* this.next(token);
        yield* this.end(forceDoc, endOffset);
      }
      /** Advance the composer by one CST token. */
      *next(token) {
        if (node_process.env.LOG_STREAM)
          console.dir(token, { depth: null });
        switch (token.type) {
          case "directive":
            this.directives.add(token.source, (offset, message, warning) => {
              const pos = getErrorPos(token);
              pos[0] += offset;
              this.onError(pos, "BAD_DIRECTIVE", message, warning);
            });
            this.prelude.push(token.source);
            this.atDirectives = true;
            break;
          case "document": {
            const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
            if (this.atDirectives && !doc.directives.docStart)
              this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
            this.decorate(doc, false);
            if (this.doc)
              yield this.doc;
            this.doc = doc;
            this.atDirectives = false;
            break;
          }
          case "byte-order-mark":
          case "space":
            break;
          case "comment":
          case "newline":
            this.prelude.push(token.source);
            break;
          case "error": {
            const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
            const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
            if (this.atDirectives || !this.doc)
              this.errors.push(error);
            else
              this.doc.errors.push(error);
            break;
          }
          case "doc-end": {
            if (!this.doc) {
              const msg = "Unexpected doc-end without preceding document";
              this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
              break;
            }
            this.doc.directives.docEnd = true;
            const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
            this.decorate(this.doc, true);
            if (end.comment) {
              const dc = this.doc.comment;
              this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
            }
            this.doc.range[2] = end.offset;
            break;
          }
          default:
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
        }
      }
      /**
       * Call at end of input to yield any remaining document.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *end(forceDoc = false, endOffset = -1) {
        if (this.doc) {
          this.decorate(this.doc, true);
          yield this.doc;
          this.doc = null;
        } else if (forceDoc) {
          const opts = Object.assign({ _directives: this.directives }, this.options);
          const doc = new Document.Document(void 0, opts);
          if (this.atDirectives)
            this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
          doc.range = [0, endOffset, endOffset];
          this.decorate(doc, false);
          yield doc;
        }
      }
    };
    exports.Composer = Composer;
  }
});

// node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS({
  "node_modules/yaml/dist/parse/cst-scalar.js"(exports) {
    "use strict";
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    var errors = require_errors();
    var stringifyString = require_stringifyString();
    function resolveAsScalar(token, strict = true, onError) {
      if (token) {
        const _onError = (pos, code, message) => {
          const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
          if (onError)
            onError(offset, code, message);
          else
            throw new errors.YAMLParseError([offset, offset + 1], code, message);
        };
        switch (token.type) {
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
          case "block-scalar":
            return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
        }
      }
      return null;
    }
    function createScalarToken(value, context) {
      const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey,
        indent: indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      const end = context.end ?? [
        { type: "newline", offset: -1, indent, source: "\n" }
      ];
      switch (source[0]) {
        case "|":
        case ">": {
          const he = source.indexOf("\n");
          const head = source.substring(0, he);
          const body = source.substring(he + 1) + "\n";
          const props = [
            { type: "block-scalar-header", offset, indent, source: head }
          ];
          if (!addEndtoBlockProps(props, end))
            props.push({ type: "newline", offset: -1, indent, source: "\n" });
          return { type: "block-scalar", offset, indent, props, source: body };
        }
        case '"':
          return { type: "double-quoted-scalar", offset, indent, source, end };
        case "'":
          return { type: "single-quoted-scalar", offset, indent, source, end };
        default:
          return { type: "scalar", offset, indent, source, end };
      }
    }
    function setScalarValue(token, value, context = {}) {
      let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
      let indent = "indent" in token ? token.indent : null;
      if (afterKey && typeof indent === "number")
        indent += 2;
      if (!type)
        switch (token.type) {
          case "single-quoted-scalar":
            type = "QUOTE_SINGLE";
            break;
          case "double-quoted-scalar":
            type = "QUOTE_DOUBLE";
            break;
          case "block-scalar": {
            const header = token.props[0];
            if (header.type !== "block-scalar-header")
              throw new Error("Invalid block scalar header");
            type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
            break;
          }
          default:
            type = "PLAIN";
        }
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey: implicitKey || indent === null,
        indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      switch (source[0]) {
        case "|":
        case ">":
          setBlockScalarValue(token, source);
          break;
        case '"':
          setFlowScalarValue(token, source, "double-quoted-scalar");
          break;
        case "'":
          setFlowScalarValue(token, source, "single-quoted-scalar");
          break;
        default:
          setFlowScalarValue(token, source, "scalar");
      }
    }
    function setBlockScalarValue(token, source) {
      const he = source.indexOf("\n");
      const head = source.substring(0, he);
      const body = source.substring(he + 1) + "\n";
      if (token.type === "block-scalar") {
        const header = token.props[0];
        if (header.type !== "block-scalar-header")
          throw new Error("Invalid block scalar header");
        header.source = head;
        token.source = body;
      } else {
        const { offset } = token;
        const indent = "indent" in token ? token.indent : -1;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0))
          props.push({ type: "newline", offset: -1, indent, source: "\n" });
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type: "block-scalar", indent, props, source: body });
      }
    }
    function addEndtoBlockProps(props, end) {
      if (end)
        for (const st of end)
          switch (st.type) {
            case "space":
            case "comment":
              props.push(st);
              break;
            case "newline":
              props.push(st);
              return true;
          }
      return false;
    }
    function setFlowScalarValue(token, source, type) {
      switch (token.type) {
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          token.type = type;
          token.source = source;
          break;
        case "block-scalar": {
          const end = token.props.slice(1);
          let oa = source.length;
          if (token.props[0].type === "block-scalar-header")
            oa -= token.props[0].source.length;
          for (const tok of end)
            tok.offset += oa;
          delete token.props;
          Object.assign(token, { type, source, end });
          break;
        }
        case "block-map":
        case "block-seq": {
          const offset = token.offset + source.length;
          const nl = { type: "newline", offset, indent: token.indent, source: "\n" };
          delete token.items;
          Object.assign(token, { type, source, end: [nl] });
          break;
        }
        default: {
          const indent = "indent" in token ? token.indent : -1;
          const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
          for (const key of Object.keys(token))
            if (key !== "type" && key !== "offset")
              delete token[key];
          Object.assign(token, { type, indent, source, end });
        }
      }
    }
    exports.createScalarToken = createScalarToken;
    exports.resolveAsScalar = resolveAsScalar;
    exports.setScalarValue = setScalarValue;
  }
});

// node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS({
  "node_modules/yaml/dist/parse/cst-stringify.js"(exports) {
    "use strict";
    var stringify = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
    function stringifyToken(token) {
      switch (token.type) {
        case "block-scalar": {
          let res = "";
          for (const tok of token.props)
            res += stringifyToken(tok);
          return res + token.source;
        }
        case "block-map":
        case "block-seq": {
          let res = "";
          for (const item of token.items)
            res += stringifyItem(item);
          return res;
        }
        case "flow-collection": {
          let res = token.start.source;
          for (const item of token.items)
            res += stringifyItem(item);
          for (const st of token.end)
            res += st.source;
          return res;
        }
        case "document": {
          let res = stringifyItem(token);
          if (token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
        default: {
          let res = token.source;
          if ("end" in token && token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
      }
    }
    function stringifyItem({ start, key, sep: sep2, value }) {
      let res = "";
      for (const st of start)
        res += st.source;
      if (key)
        res += stringifyToken(key);
      if (sep2)
        for (const st of sep2)
          res += st.source;
      if (value)
        res += stringifyToken(value);
      return res;
    }
    exports.stringify = stringify;
  }
});

// node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS({
  "node_modules/yaml/dist/parse/cst-visit.js"(exports) {
    "use strict";
    var BREAK = Symbol("break visit");
    var SKIP = Symbol("skip children");
    var REMOVE = Symbol("remove item");
    function visit(cst, visitor) {
      if ("type" in cst && cst.type === "document")
        cst = { start: cst.start, value: cst.value };
      _visit(Object.freeze([]), cst, visitor);
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    visit.itemAtPath = (cst, path11) => {
      let item = cst;
      for (const [field, index] of path11) {
        const tok = item?.[field];
        if (tok && "items" in tok) {
          item = tok.items[index];
        } else
          return void 0;
      }
      return item;
    };
    visit.parentCollection = (cst, path11) => {
      const parent = visit.itemAtPath(cst, path11.slice(0, -1));
      const field = path11[path11.length - 1][0];
      const coll = parent?.[field];
      if (coll && "items" in coll)
        return coll;
      throw new Error("Parent collection not found");
    };
    function _visit(path11, item, visitor) {
      let ctrl = visitor(item, path11);
      if (typeof ctrl === "symbol")
        return ctrl;
      for (const field of ["key", "value"]) {
        const token = item[field];
        if (token && "items" in token) {
          for (let i = 0; i < token.items.length; ++i) {
            const ci = _visit(Object.freeze(path11.concat([[field, i]])), token.items[i], visitor);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              token.items.splice(i, 1);
              i -= 1;
            }
          }
          if (typeof ctrl === "function" && field === "key")
            ctrl = ctrl(item, path11);
        }
      }
      return typeof ctrl === "function" ? ctrl(item, path11) : ctrl;
    }
    exports.visit = visit;
  }
});

// node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS({
  "node_modules/yaml/dist/parse/cst.js"(exports) {
    "use strict";
    var cstScalar = require_cst_scalar();
    var cstStringify = require_cst_stringify();
    var cstVisit = require_cst_visit();
    var BOM = "\uFEFF";
    var DOCUMENT = "";
    var FLOW_END = "";
    var SCALAR = "";
    var isCollection = (token) => !!token && "items" in token;
    var isScalar2 = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
    function prettyToken(token) {
      switch (token) {
        case BOM:
          return "<BOM>";
        case DOCUMENT:
          return "<DOC>";
        case FLOW_END:
          return "<FLOW_END>";
        case SCALAR:
          return "<SCALAR>";
        default:
          return JSON.stringify(token);
      }
    }
    function tokenType(source) {
      switch (source) {
        case BOM:
          return "byte-order-mark";
        case DOCUMENT:
          return "doc-mode";
        case FLOW_END:
          return "flow-error-end";
        case SCALAR:
          return "scalar";
        case "---":
          return "doc-start";
        case "...":
          return "doc-end";
        case "":
        case "\n":
        case "\r\n":
          return "newline";
        case "-":
          return "seq-item-ind";
        case "?":
          return "explicit-key-ind";
        case ":":
          return "map-value-ind";
        case "{":
          return "flow-map-start";
        case "}":
          return "flow-map-end";
        case "[":
          return "flow-seq-start";
        case "]":
          return "flow-seq-end";
        case ",":
          return "comma";
      }
      switch (source[0]) {
        case " ":
        case "	":
          return "space";
        case "#":
          return "comment";
        case "%":
          return "directive-line";
        case "*":
          return "alias";
        case "&":
          return "anchor";
        case "!":
          return "tag";
        case "'":
          return "single-quoted-scalar";
        case '"':
          return "double-quoted-scalar";
        case "|":
        case ">":
          return "block-scalar-header";
      }
      return null;
    }
    exports.createScalarToken = cstScalar.createScalarToken;
    exports.resolveAsScalar = cstScalar.resolveAsScalar;
    exports.setScalarValue = cstScalar.setScalarValue;
    exports.stringify = cstStringify.stringify;
    exports.visit = cstVisit.visit;
    exports.BOM = BOM;
    exports.DOCUMENT = DOCUMENT;
    exports.FLOW_END = FLOW_END;
    exports.SCALAR = SCALAR;
    exports.isCollection = isCollection;
    exports.isScalar = isScalar2;
    exports.prettyToken = prettyToken;
    exports.tokenType = tokenType;
  }
});

// node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS({
  "node_modules/yaml/dist/parse/lexer.js"(exports) {
    "use strict";
    var cst = require_cst();
    function isEmpty(ch) {
      switch (ch) {
        case void 0:
        case " ":
        case "\n":
        case "\r":
        case "	":
          return true;
        default:
          return false;
      }
    }
    var hexDigits = new Set("0123456789ABCDEFabcdef");
    var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
    var flowIndicatorChars = new Set(",[]{}");
    var invalidAnchorChars = new Set(" ,[]{}\n\r	");
    var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
    var Lexer = class {
      constructor() {
        this.atEnd = false;
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        this.buffer = "";
        this.flowKey = false;
        this.flowLevel = 0;
        this.indentNext = 0;
        this.indentValue = 0;
        this.lineEndPos = null;
        this.next = null;
        this.pos = 0;
      }
      /**
       * Generate YAML tokens from the `source` string. If `incomplete`,
       * a part of the last line may be left as a buffer for the next call.
       *
       * @returns A generator of lexical tokens
       */
      *lex(source, incomplete = false) {
        if (source) {
          if (typeof source !== "string")
            throw TypeError("source is not a string");
          this.buffer = this.buffer ? this.buffer + source : source;
          this.lineEndPos = null;
        }
        this.atEnd = !incomplete;
        let next = this.next ?? "stream";
        while (next && (incomplete || this.hasChars(1)))
          next = yield* this.parseNext(next);
      }
      atLineEnd() {
        let i = this.pos;
        let ch = this.buffer[i];
        while (ch === " " || ch === "	")
          ch = this.buffer[++i];
        if (!ch || ch === "#" || ch === "\n")
          return true;
        if (ch === "\r")
          return this.buffer[i + 1] === "\n";
        return false;
      }
      charAt(n) {
        return this.buffer[this.pos + n];
      }
      continueScalar(offset) {
        let ch = this.buffer[offset];
        if (this.indentNext > 0) {
          let indent = 0;
          while (ch === " ")
            ch = this.buffer[++indent + offset];
          if (ch === "\r") {
            const next = this.buffer[indent + offset + 1];
            if (next === "\n" || !next && !this.atEnd)
              return offset + indent + 1;
          }
          return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
        }
        if (ch === "-" || ch === ".") {
          const dt = this.buffer.substr(offset, 3);
          if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
            return -1;
        }
        return offset;
      }
      getLine() {
        let end = this.lineEndPos;
        if (typeof end !== "number" || end !== -1 && end < this.pos) {
          end = this.buffer.indexOf("\n", this.pos);
          this.lineEndPos = end;
        }
        if (end === -1)
          return this.atEnd ? this.buffer.substring(this.pos) : null;
        if (this.buffer[end - 1] === "\r")
          end -= 1;
        return this.buffer.substring(this.pos, end);
      }
      hasChars(n) {
        return this.pos + n <= this.buffer.length;
      }
      setNext(state) {
        this.buffer = this.buffer.substring(this.pos);
        this.pos = 0;
        this.lineEndPos = null;
        this.next = state;
        return null;
      }
      peek(n) {
        return this.buffer.substr(this.pos, n);
      }
      *parseNext(next) {
        switch (next) {
          case "stream":
            return yield* this.parseStream();
          case "line-start":
            return yield* this.parseLineStart();
          case "block-start":
            return yield* this.parseBlockStart();
          case "doc":
            return yield* this.parseDocument();
          case "flow":
            return yield* this.parseFlowCollection();
          case "quoted-scalar":
            return yield* this.parseQuotedScalar();
          case "block-scalar":
            return yield* this.parseBlockScalar();
          case "plain-scalar":
            return yield* this.parsePlainScalar();
        }
      }
      *parseStream() {
        let line = this.getLine();
        if (line === null)
          return this.setNext("stream");
        if (line[0] === cst.BOM) {
          yield* this.pushCount(1);
          line = line.substring(1);
        }
        if (line[0] === "%") {
          let dirEnd = line.length;
          let cs = line.indexOf("#");
          while (cs !== -1) {
            const ch = line[cs - 1];
            if (ch === " " || ch === "	") {
              dirEnd = cs - 1;
              break;
            } else {
              cs = line.indexOf("#", cs + 1);
            }
          }
          while (true) {
            const ch = line[dirEnd - 1];
            if (ch === " " || ch === "	")
              dirEnd -= 1;
            else
              break;
          }
          const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
          yield* this.pushCount(line.length - n);
          this.pushNewline();
          return "stream";
        }
        if (this.atLineEnd()) {
          const sp = yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - sp);
          yield* this.pushNewline();
          return "stream";
        }
        yield cst.DOCUMENT;
        return yield* this.parseLineStart();
      }
      *parseLineStart() {
        const ch = this.charAt(0);
        if (!ch && !this.atEnd)
          return this.setNext("line-start");
        if (ch === "-" || ch === ".") {
          if (!this.atEnd && !this.hasChars(4))
            return this.setNext("line-start");
          const s = this.peek(3);
          if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
            yield* this.pushCount(3);
            this.indentValue = 0;
            this.indentNext = 0;
            return s === "---" ? "doc" : "stream";
          }
        }
        this.indentValue = yield* this.pushSpaces(false);
        if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
          this.indentNext = this.indentValue;
        return yield* this.parseBlockStart();
      }
      *parseBlockStart() {
        const [ch0, ch1] = this.peek(2);
        if (!ch1 && !this.atEnd)
          return this.setNext("block-start");
        if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
          const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
          this.indentNext = this.indentValue + 1;
          this.indentValue += n;
          return "block-start";
        }
        return "doc";
      }
      *parseDocument() {
        yield* this.pushSpaces(true);
        const line = this.getLine();
        if (line === null)
          return this.setNext("doc");
        let n = yield* this.pushIndicators();
        switch (line[n]) {
          case "#":
            yield* this.pushCount(line.length - n);
          // fallthrough
          case void 0:
            yield* this.pushNewline();
            return yield* this.parseLineStart();
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel = 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            return "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "doc";
          case '"':
          case "'":
            return yield* this.parseQuotedScalar();
          case "|":
          case ">":
            n += yield* this.parseBlockScalarHeader();
            n += yield* this.pushSpaces(true);
            yield* this.pushCount(line.length - n);
            yield* this.pushNewline();
            return yield* this.parseBlockScalar();
          default:
            return yield* this.parsePlainScalar();
        }
      }
      *parseFlowCollection() {
        let nl, sp;
        let indent = -1;
        do {
          nl = yield* this.pushNewline();
          if (nl > 0) {
            sp = yield* this.pushSpaces(false);
            this.indentValue = indent = sp;
          } else {
            sp = 0;
          }
          sp += yield* this.pushSpaces(true);
        } while (nl + sp > 0);
        const line = this.getLine();
        if (line === null)
          return this.setNext("flow");
        if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
          const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
          if (!atFlowEndMarker) {
            this.flowLevel = 0;
            yield cst.FLOW_END;
            return yield* this.parseLineStart();
          }
        }
        let n = 0;
        while (line[n] === ",") {
          n += yield* this.pushCount(1);
          n += yield* this.pushSpaces(true);
          this.flowKey = false;
        }
        n += yield* this.pushIndicators();
        switch (line[n]) {
          case void 0:
            return "flow";
          case "#":
            yield* this.pushCount(line.length - n);
            return "flow";
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel += 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            this.flowKey = true;
            this.flowLevel -= 1;
            return this.flowLevel ? "flow" : "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "flow";
          case '"':
          case "'":
            this.flowKey = true;
            return yield* this.parseQuotedScalar();
          case ":": {
            const next = this.charAt(1);
            if (this.flowKey || isEmpty(next) || next === ",") {
              this.flowKey = false;
              yield* this.pushCount(1);
              yield* this.pushSpaces(true);
              return "flow";
            }
          }
          // fallthrough
          default:
            this.flowKey = false;
            return yield* this.parsePlainScalar();
        }
      }
      *parseQuotedScalar() {
        const quote = this.charAt(0);
        let end = this.buffer.indexOf(quote, this.pos + 1);
        if (quote === "'") {
          while (end !== -1 && this.buffer[end + 1] === "'")
            end = this.buffer.indexOf("'", end + 2);
        } else {
          while (end !== -1) {
            let n = 0;
            while (this.buffer[end - 1 - n] === "\\")
              n += 1;
            if (n % 2 === 0)
              break;
            end = this.buffer.indexOf('"', end + 1);
          }
        }
        const qb = this.buffer.substring(0, end);
        let nl = qb.indexOf("\n", this.pos);
        if (nl !== -1) {
          while (nl !== -1) {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = qb.indexOf("\n", cs);
          }
          if (nl !== -1) {
            end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
          }
        }
        if (end === -1) {
          if (!this.atEnd)
            return this.setNext("quoted-scalar");
          end = this.buffer.length;
        }
        yield* this.pushToIndex(end + 1, false);
        return this.flowLevel ? "flow" : "doc";
      }
      *parseBlockScalarHeader() {
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        let i = this.pos;
        while (true) {
          const ch = this.buffer[++i];
          if (ch === "+")
            this.blockScalarKeep = true;
          else if (ch > "0" && ch <= "9")
            this.blockScalarIndent = Number(ch) - 1;
          else if (ch !== "-")
            break;
        }
        return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
      }
      *parseBlockScalar() {
        let nl = this.pos - 1;
        let indent = 0;
        let ch;
        loop: for (let i2 = this.pos; ch = this.buffer[i2]; ++i2) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case "\n":
              nl = i2;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i2 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === "\n")
                break;
            }
            // fallthrough
            default:
              break loop;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("block-scalar");
        if (indent >= this.indentNext) {
          if (this.blockScalarIndent === -1)
            this.indentNext = indent;
          else {
            this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
          }
          do {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = this.buffer.indexOf("\n", cs);
          } while (nl !== -1);
          if (nl === -1) {
            if (!this.atEnd)
              return this.setNext("block-scalar");
            nl = this.buffer.length;
          }
        }
        let i = nl + 1;
        ch = this.buffer[i];
        while (ch === " ")
          ch = this.buffer[++i];
        if (ch === "	") {
          while (ch === "	" || ch === " " || ch === "\r" || ch === "\n")
            ch = this.buffer[++i];
          nl = i - 1;
        } else if (!this.blockScalarKeep) {
          do {
            let i2 = nl - 1;
            let ch2 = this.buffer[i2];
            if (ch2 === "\r")
              ch2 = this.buffer[--i2];
            const lastChar = i2;
            while (ch2 === " ")
              ch2 = this.buffer[--i2];
            if (ch2 === "\n" && i2 >= this.pos && i2 + 1 + indent > lastChar)
              nl = i2;
            else
              break;
          } while (true);
        }
        yield cst.SCALAR;
        yield* this.pushToIndex(nl + 1, true);
        return yield* this.parseLineStart();
      }
      *parsePlainScalar() {
        const inFlow = this.flowLevel > 0;
        let end = this.pos - 1;
        let i = this.pos - 1;
        let ch;
        while (ch = this.buffer[++i]) {
          if (ch === ":") {
            const next = this.buffer[i + 1];
            if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
              break;
            end = i;
          } else if (isEmpty(ch)) {
            let next = this.buffer[i + 1];
            if (ch === "\r") {
              if (next === "\n") {
                i += 1;
                ch = "\n";
                next = this.buffer[i + 1];
              } else
                end = i;
            }
            if (next === "#" || inFlow && flowIndicatorChars.has(next))
              break;
            if (ch === "\n") {
              const cs = this.continueScalar(i + 1);
              if (cs === -1)
                break;
              i = Math.max(i, cs - 2);
            }
          } else {
            if (inFlow && flowIndicatorChars.has(ch))
              break;
            end = i;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("plain-scalar");
        yield cst.SCALAR;
        yield* this.pushToIndex(end + 1, true);
        return inFlow ? "flow" : "doc";
      }
      *pushCount(n) {
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos += n;
          return n;
        }
        return 0;
      }
      *pushToIndex(i, allowEmpty) {
        const s = this.buffer.slice(this.pos, i);
        if (s) {
          yield s;
          this.pos += s.length;
          return s.length;
        } else if (allowEmpty)
          yield "";
        return 0;
      }
      *pushIndicators() {
        let n = 0;
        loop: while (true) {
          switch (this.charAt(0)) {
            case "!":
              n += yield* this.pushTag();
              n += yield* this.pushSpaces(true);
              continue loop;
            case "&":
              n += yield* this.pushUntil(isNotAnchorChar);
              n += yield* this.pushSpaces(true);
              continue loop;
            case "-":
            // this is an error
            case "?":
            // this is an error outside flow collections
            case ":": {
              const inFlow = this.flowLevel > 0;
              const ch1 = this.charAt(1);
              if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
                if (!inFlow)
                  this.indentNext = this.indentValue + 1;
                else if (this.flowKey)
                  this.flowKey = false;
                n += yield* this.pushCount(1);
                n += yield* this.pushSpaces(true);
                continue loop;
              }
            }
          }
          break loop;
        }
        return n;
      }
      *pushTag() {
        if (this.charAt(1) === "<") {
          let i = this.pos + 2;
          let ch = this.buffer[i];
          while (!isEmpty(ch) && ch !== ">")
            ch = this.buffer[++i];
          return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
        } else {
          let i = this.pos + 1;
          let ch = this.buffer[i];
          while (ch) {
            if (tagChars.has(ch))
              ch = this.buffer[++i];
            else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
              ch = this.buffer[i += 3];
            } else
              break;
          }
          return yield* this.pushToIndex(i, false);
        }
      }
      *pushNewline() {
        const ch = this.buffer[this.pos];
        if (ch === "\n")
          return yield* this.pushCount(1);
        else if (ch === "\r" && this.charAt(1) === "\n")
          return yield* this.pushCount(2);
        else
          return 0;
      }
      *pushSpaces(allowTabs) {
        let i = this.pos - 1;
        let ch;
        do {
          ch = this.buffer[++i];
        } while (ch === " " || allowTabs && ch === "	");
        const n = i - this.pos;
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos = i;
        }
        return n;
      }
      *pushUntil(test) {
        let i = this.pos;
        let ch = this.buffer[i];
        while (!test(ch))
          ch = this.buffer[++i];
        return yield* this.pushToIndex(i, false);
      }
    };
    exports.Lexer = Lexer;
  }
});

// node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS({
  "node_modules/yaml/dist/parse/line-counter.js"(exports) {
    "use strict";
    var LineCounter = class {
      constructor() {
        this.lineStarts = [];
        this.addNewLine = (offset) => this.lineStarts.push(offset);
        this.linePos = (offset) => {
          let low = 0;
          let high = this.lineStarts.length;
          while (low < high) {
            const mid = low + high >> 1;
            if (this.lineStarts[mid] < offset)
              low = mid + 1;
            else
              high = mid;
          }
          if (this.lineStarts[low] === offset)
            return { line: low + 1, col: 1 };
          if (low === 0)
            return { line: 0, col: offset };
          const start = this.lineStarts[low - 1];
          return { line: low, col: offset - start + 1 };
        };
      }
    };
    exports.LineCounter = LineCounter;
  }
});

// node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS({
  "node_modules/yaml/dist/parse/parser.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var cst = require_cst();
    var lexer = require_lexer();
    function includesToken(list, type) {
      for (let i = 0; i < list.length; ++i)
        if (list[i].type === type)
          return true;
      return false;
    }
    function findNonEmptyIndex(list) {
      for (let i = 0; i < list.length; ++i) {
        switch (list[i].type) {
          case "space":
          case "comment":
          case "newline":
            break;
          default:
            return i;
        }
      }
      return -1;
    }
    function isFlowToken(token) {
      switch (token?.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "flow-collection":
          return true;
        default:
          return false;
      }
    }
    function getPrevProps(parent) {
      switch (parent.type) {
        case "document":
          return parent.start;
        case "block-map": {
          const it = parent.items[parent.items.length - 1];
          return it.sep ?? it.start;
        }
        case "block-seq":
          return parent.items[parent.items.length - 1].start;
        /* istanbul ignore next should not happen */
        default:
          return [];
      }
    }
    function getFirstKeyStartProps(prev) {
      if (prev.length === 0)
        return [];
      let i = prev.length;
      loop: while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
      while (prev[++i]?.type === "space") {
      }
      return prev.splice(i, prev.length);
    }
    function arrayPushArray(target, source) {
      if (source.length < 1e5)
        Array.prototype.push.apply(target, source);
      else
        for (let i = 0; i < source.length; ++i)
          target.push(source[i]);
    }
    function fixFlowSeqItems(fc) {
      if (fc.start.type === "flow-seq-start") {
        for (const it of fc.items) {
          if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
            if (it.key)
              it.value = it.key;
            delete it.key;
            if (isFlowToken(it.value)) {
              if (it.value.end)
                arrayPushArray(it.value.end, it.sep);
              else
                it.value.end = it.sep;
            } else
              arrayPushArray(it.start, it.sep);
            delete it.sep;
          }
        }
      }
    }
    var Parser = class {
      /**
       * @param onNewLine - If defined, called separately with the start position of
       *   each new line (in `parse()`, including the start of input).
       */
      constructor(onNewLine) {
        this.atNewLine = true;
        this.atScalar = false;
        this.indent = 0;
        this.offset = 0;
        this.onKeyLine = false;
        this.stack = [];
        this.source = "";
        this.type = "";
        this.lexer = new lexer.Lexer();
        this.onNewLine = onNewLine;
      }
      /**
       * Parse `source` as a YAML stream.
       * If `incomplete`, a part of the last line may be left as a buffer for the next call.
       *
       * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
       *
       * @returns A generator of tokens representing each directive, document, and other structure.
       */
      *parse(source, incomplete = false) {
        if (this.onNewLine && this.offset === 0)
          this.onNewLine(0);
        for (const lexeme of this.lexer.lex(source, incomplete))
          yield* this.next(lexeme);
        if (!incomplete)
          yield* this.end();
      }
      /**
       * Advance the parser by the `source` of one lexical token.
       */
      *next(source) {
        this.source = source;
        if (node_process.env.LOG_TOKENS)
          console.log("|", cst.prettyToken(source));
        if (this.atScalar) {
          this.atScalar = false;
          yield* this.step();
          this.offset += source.length;
          return;
        }
        const type = cst.tokenType(source);
        if (!type) {
          const message = `Not a YAML token: ${source}`;
          yield* this.pop({ type: "error", offset: this.offset, message, source });
          this.offset += source.length;
        } else if (type === "scalar") {
          this.atNewLine = false;
          this.atScalar = true;
          this.type = "scalar";
        } else {
          this.type = type;
          yield* this.step();
          switch (type) {
            case "newline":
              this.atNewLine = true;
              this.indent = 0;
              if (this.onNewLine)
                this.onNewLine(this.offset + source.length);
              break;
            case "space":
              if (this.atNewLine && source[0] === " ")
                this.indent += source.length;
              break;
            case "explicit-key-ind":
            case "map-value-ind":
            case "seq-item-ind":
              if (this.atNewLine)
                this.indent += source.length;
              break;
            case "doc-mode":
            case "flow-error-end":
              return;
            default:
              this.atNewLine = false;
          }
          this.offset += source.length;
        }
      }
      /** Call at end of input to push out any remaining constructions */
      *end() {
        while (this.stack.length > 0)
          yield* this.pop();
      }
      get sourceToken() {
        const st = {
          type: this.type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
        return st;
      }
      *step() {
        const top = this.peek(1);
        if (this.type === "doc-end" && top?.type !== "doc-end") {
          while (this.stack.length > 0)
            yield* this.pop();
          this.stack.push({
            type: "doc-end",
            offset: this.offset,
            source: this.source
          });
          return;
        }
        if (!top)
          return yield* this.stream();
        switch (top.type) {
          case "document":
            return yield* this.document(top);
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return yield* this.scalar(top);
          case "block-scalar":
            return yield* this.blockScalar(top);
          case "block-map":
            return yield* this.blockMap(top);
          case "block-seq":
            return yield* this.blockSequence(top);
          case "flow-collection":
            return yield* this.flowCollection(top);
          case "doc-end":
            return yield* this.documentEnd(top);
        }
        yield* this.pop();
      }
      peek(n) {
        return this.stack[this.stack.length - n];
      }
      *pop(error) {
        const token = error ?? this.stack.pop();
        if (!token) {
          const message = "Tried to pop an empty stack";
          yield { type: "error", offset: this.offset, source: "", message };
        } else if (this.stack.length === 0) {
          yield token;
        } else {
          const top = this.peek(1);
          if (token.type === "block-scalar") {
            token.indent = "indent" in top ? top.indent : 0;
          } else if (token.type === "flow-collection" && top.type === "document") {
            token.indent = 0;
          }
          if (token.type === "flow-collection")
            fixFlowSeqItems(token);
          switch (top.type) {
            case "document":
              top.value = token;
              break;
            case "block-scalar":
              top.props.push(token);
              break;
            case "block-map": {
              const it = top.items[top.items.length - 1];
              if (it.value) {
                top.items.push({ start: [], key: token, sep: [] });
                this.onKeyLine = true;
                return;
              } else if (it.sep) {
                it.value = token;
              } else {
                Object.assign(it, { key: token, sep: [] });
                this.onKeyLine = !it.explicitKey;
                return;
              }
              break;
            }
            case "block-seq": {
              const it = top.items[top.items.length - 1];
              if (it.value)
                top.items.push({ start: [], value: token });
              else
                it.value = token;
              break;
            }
            case "flow-collection": {
              const it = top.items[top.items.length - 1];
              if (!it || it.value)
                top.items.push({ start: [], key: token, sep: [] });
              else if (it.sep)
                it.value = token;
              else
                Object.assign(it, { key: token, sep: [] });
              return;
            }
            /* istanbul ignore next should not happen */
            default:
              yield* this.pop();
              yield* this.pop(token);
          }
          if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
            const last = token.items[token.items.length - 1];
            if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
              if (top.type === "document")
                top.end = last.start;
              else
                top.items.push({ start: last.start });
              token.items.splice(-1, 1);
            }
          }
        }
      }
      *stream() {
        switch (this.type) {
          case "directive-line":
            yield { type: "directive", offset: this.offset, source: this.source };
            return;
          case "byte-order-mark":
          case "space":
          case "comment":
          case "newline":
            yield this.sourceToken;
            return;
          case "doc-mode":
          case "doc-start": {
            const doc = {
              type: "document",
              offset: this.offset,
              start: []
            };
            if (this.type === "doc-start")
              doc.start.push(this.sourceToken);
            this.stack.push(doc);
            return;
          }
        }
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML stream`,
          source: this.source
        };
      }
      *document(doc) {
        if (doc.value)
          return yield* this.lineEnd(doc);
        switch (this.type) {
          case "doc-start": {
            if (findNonEmptyIndex(doc.start) !== -1) {
              yield* this.pop();
              yield* this.step();
            } else
              doc.start.push(this.sourceToken);
            return;
          }
          case "anchor":
          case "tag":
          case "space":
          case "comment":
          case "newline":
            doc.start.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(doc);
        if (bv)
          this.stack.push(bv);
        else {
          yield {
            type: "error",
            offset: this.offset,
            message: `Unexpected ${this.type} token in YAML document`,
            source: this.source
          };
        }
      }
      *scalar(scalar) {
        if (this.type === "map-value-ind") {
          const prev = getPrevProps(this.peek(2));
          const start = getFirstKeyStartProps(prev);
          let sep2;
          if (scalar.end) {
            sep2 = scalar.end;
            sep2.push(this.sourceToken);
            delete scalar.end;
          } else
            sep2 = [this.sourceToken];
          const map = {
            type: "block-map",
            offset: scalar.offset,
            indent: scalar.indent,
            items: [{ start, key: scalar, sep: sep2 }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else
          yield* this.lineEnd(scalar);
      }
      *blockScalar(scalar) {
        switch (this.type) {
          case "space":
          case "comment":
          case "newline":
            scalar.props.push(this.sourceToken);
            return;
          case "scalar":
            scalar.source = this.source;
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine) {
              let nl = this.source.indexOf("\n") + 1;
              while (nl !== 0) {
                this.onNewLine(this.offset + nl);
                nl = this.source.indexOf("\n", nl) + 1;
              }
            }
            yield* this.pop();
            break;
          /* istanbul ignore next should not happen */
          default:
            yield* this.pop();
            yield* this.step();
        }
      }
      *blockMap(map) {
        const it = map.items[map.items.length - 1];
        switch (this.type) {
          case "newline":
            this.onKeyLine = false;
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "space":
          case "comment":
            if (it.value) {
              map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              if (this.atIndentedComment(it.start, map.indent)) {
                const prev = map.items[map.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  map.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
        }
        if (this.indent >= map.indent) {
          const atMapIndent = !this.onKeyLine && this.indent === map.indent;
          const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
          let start = [];
          if (atNextItem && it.sep && !it.value) {
            const nl = [];
            for (let i = 0; i < it.sep.length; ++i) {
              const st = it.sep[i];
              switch (st.type) {
                case "newline":
                  nl.push(i);
                  break;
                case "space":
                  break;
                case "comment":
                  if (st.indent > map.indent)
                    nl.length = 0;
                  break;
                default:
                  nl.length = 0;
              }
            }
            if (nl.length >= 2)
              start = it.sep.splice(nl[1]);
          }
          switch (this.type) {
            case "anchor":
            case "tag":
              if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start });
                this.onKeyLine = true;
              } else if (it.sep) {
                it.sep.push(this.sourceToken);
              } else {
                it.start.push(this.sourceToken);
              }
              return;
            case "explicit-key-ind":
              if (!it.sep && !it.explicitKey) {
                it.start.push(this.sourceToken);
                it.explicitKey = true;
              } else if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start, explicitKey: true });
              } else {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [this.sourceToken], explicitKey: true }]
                });
              }
              this.onKeyLine = true;
              return;
            case "map-value-ind":
              if (it.explicitKey) {
                if (!it.sep) {
                  if (includesToken(it.start, "newline")) {
                    Object.assign(it, { key: null, sep: [this.sourceToken] });
                  } else {
                    const start2 = getFirstKeyStartProps(it.start);
                    this.stack.push({
                      type: "block-map",
                      offset: this.offset,
                      indent: this.indent,
                      items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                    });
                  }
                } else if (it.value) {
                  map.items.push({ start: [], key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, key: null, sep: [this.sourceToken] }]
                  });
                } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                  const start2 = getFirstKeyStartProps(it.start);
                  const key = it.key;
                  const sep2 = it.sep;
                  sep2.push(this.sourceToken);
                  delete it.key;
                  delete it.sep;
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key, sep: sep2 }]
                  });
                } else if (start.length > 0) {
                  it.sep = it.sep.concat(start, this.sourceToken);
                } else {
                  it.sep.push(this.sourceToken);
                }
              } else {
                if (!it.sep) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else if (it.value || atNextItem) {
                  map.items.push({ start, key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: [], key: null, sep: [this.sourceToken] }]
                  });
                } else {
                  it.sep.push(this.sourceToken);
                }
              }
              this.onKeyLine = true;
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs12 = this.flowScalar(this.type);
              if (atNextItem || it.value) {
                map.items.push({ start, key: fs12, sep: [] });
                this.onKeyLine = true;
              } else if (it.sep) {
                this.stack.push(fs12);
              } else {
                Object.assign(it, { key: fs12, sep: [] });
                this.onKeyLine = true;
              }
              return;
            }
            default: {
              const bv = this.startBlockValue(map);
              if (bv) {
                if (bv.type === "block-seq") {
                  if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                    yield* this.pop({
                      type: "error",
                      offset: this.offset,
                      message: "Unexpected block-seq-ind on same line with key",
                      source: this.source
                    });
                    return;
                  }
                } else if (atMapIndent) {
                  map.items.push({ start });
                }
                this.stack.push(bv);
                return;
              }
            }
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *blockSequence(seq) {
        const it = seq.items[seq.items.length - 1];
        switch (this.type) {
          case "newline":
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                seq.items.push({ start: [this.sourceToken] });
            } else
              it.start.push(this.sourceToken);
            return;
          case "space":
          case "comment":
            if (it.value)
              seq.items.push({ start: [this.sourceToken] });
            else {
              if (this.atIndentedComment(it.start, seq.indent)) {
                const prev = seq.items[seq.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  seq.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
          case "anchor":
          case "tag":
            if (it.value || this.indent <= seq.indent)
              break;
            it.start.push(this.sourceToken);
            return;
          case "seq-item-ind":
            if (this.indent !== seq.indent)
              break;
            if (it.value || includesToken(it.start, "seq-item-ind"))
              seq.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
        }
        if (this.indent > seq.indent) {
          const bv = this.startBlockValue(seq);
          if (bv) {
            this.stack.push(bv);
            return;
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *flowCollection(fc) {
        const it = fc.items[fc.items.length - 1];
        if (this.type === "flow-error-end") {
          let top;
          do {
            yield* this.pop();
            top = this.peek(1);
          } while (top?.type === "flow-collection");
        } else if (fc.end.length === 0) {
          switch (this.type) {
            case "comma":
            case "explicit-key-ind":
              if (!it || it.sep)
                fc.items.push({ start: [this.sourceToken] });
              else
                it.start.push(this.sourceToken);
              return;
            case "map-value-ind":
              if (!it || it.value)
                fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              return;
            case "space":
            case "comment":
            case "newline":
            case "anchor":
            case "tag":
              if (!it || it.value)
                fc.items.push({ start: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                it.start.push(this.sourceToken);
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs12 = this.flowScalar(this.type);
              if (!it || it.value)
                fc.items.push({ start: [], key: fs12, sep: [] });
              else if (it.sep)
                this.stack.push(fs12);
              else
                Object.assign(it, { key: fs12, sep: [] });
              return;
            }
            case "flow-map-end":
            case "flow-seq-end":
              fc.end.push(this.sourceToken);
              return;
          }
          const bv = this.startBlockValue(fc);
          if (bv)
            this.stack.push(bv);
          else {
            yield* this.pop();
            yield* this.step();
          }
        } else {
          const parent = this.peek(2);
          if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
            yield* this.pop();
            yield* this.step();
          } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            fixFlowSeqItems(fc);
            const sep2 = fc.end.splice(1, fc.end.length);
            sep2.push(this.sourceToken);
            const map = {
              type: "block-map",
              offset: fc.offset,
              indent: fc.indent,
              items: [{ start, key: fc, sep: sep2 }]
            };
            this.onKeyLine = true;
            this.stack[this.stack.length - 1] = map;
          } else {
            yield* this.lineEnd(fc);
          }
        }
      }
      flowScalar(type) {
        if (this.onNewLine) {
          let nl = this.source.indexOf("\n") + 1;
          while (nl !== 0) {
            this.onNewLine(this.offset + nl);
            nl = this.source.indexOf("\n", nl) + 1;
          }
        }
        return {
          type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
      }
      startBlockValue(parent) {
        switch (this.type) {
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return this.flowScalar(this.type);
          case "block-scalar-header":
            return {
              type: "block-scalar",
              offset: this.offset,
              indent: this.indent,
              props: [this.sourceToken],
              source: ""
            };
          case "flow-map-start":
          case "flow-seq-start":
            return {
              type: "flow-collection",
              offset: this.offset,
              indent: this.indent,
              start: this.sourceToken,
              items: [],
              end: []
            };
          case "seq-item-ind":
            return {
              type: "block-seq",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken] }]
            };
          case "explicit-key-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            start.push(this.sourceToken);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, explicitKey: true }]
            };
          }
          case "map-value-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, key: null, sep: [this.sourceToken] }]
            };
          }
        }
        return null;
      }
      atIndentedComment(start, indent) {
        if (this.type !== "comment")
          return false;
        if (this.indent <= indent)
          return false;
        return start.every((st) => st.type === "newline" || st.type === "space");
      }
      *documentEnd(docEnd) {
        if (this.type !== "doc-mode") {
          if (docEnd.end)
            docEnd.end.push(this.sourceToken);
          else
            docEnd.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
        }
      }
      *lineEnd(token) {
        switch (this.type) {
          case "comma":
          case "doc-start":
          case "doc-end":
          case "flow-seq-end":
          case "flow-map-end":
          case "map-value-ind":
            yield* this.pop();
            yield* this.step();
            break;
          case "newline":
            this.onKeyLine = false;
          // fallthrough
          case "space":
          case "comment":
          default:
            if (token.end)
              token.end.push(this.sourceToken);
            else
              token.end = [this.sourceToken];
            if (this.type === "newline")
              yield* this.pop();
        }
      }
    };
    exports.Parser = Parser;
  }
});

// node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS({
  "node_modules/yaml/dist/public-api.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var errors = require_errors();
    var log = require_log();
    var identity = require_identity();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    function parseOptions(options) {
      const prettyErrors = options.prettyErrors !== false;
      const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter() || null;
      return { lineCounter: lineCounter$1, prettyErrors };
    }
    function parseAllDocuments(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      const docs = Array.from(composer$1.compose(parser$1.parse(source)));
      if (prettyErrors && lineCounter2)
        for (const doc of docs) {
          doc.errors.forEach(errors.prettifyError(source, lineCounter2));
          doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
        }
      if (docs.length > 0)
        return docs;
      return Object.assign([], { empty: true }, composer$1.streamInfo());
    }
    function parseDocument(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      let doc = null;
      for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
        if (!doc)
          doc = _doc;
        else if (doc.options.logLevel !== "silent") {
          doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
          break;
        }
      }
      if (prettyErrors && lineCounter2) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
      }
      return doc;
    }
    function parse(src, reviver, options) {
      let _reviver = void 0;
      if (typeof reviver === "function") {
        _reviver = reviver;
      } else if (options === void 0 && reviver && typeof reviver === "object") {
        options = reviver;
      }
      const doc = parseDocument(src, options);
      if (!doc)
        return null;
      doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
      if (doc.errors.length > 0) {
        if (doc.options.logLevel !== "silent")
          throw doc.errors[0];
        else
          doc.errors = [];
      }
      return doc.toJS(Object.assign({ reviver: _reviver }, options));
    }
    function stringify(value, replacer, options) {
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === void 0 && replacer) {
        options = replacer;
      }
      if (typeof options === "string")
        options = options.length;
      if (typeof options === "number") {
        const indent = Math.round(options);
        options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
      }
      if (value === void 0) {
        const { keepUndefined } = options ?? replacer ?? {};
        if (!keepUndefined)
          return void 0;
      }
      if (identity.isDocument(value) && !_replacer)
        return value.toString(options);
      return new Document.Document(value, _replacer, options).toString(options);
    }
    exports.parse = parse;
    exports.parseAllDocuments = parseAllDocuments;
    exports.parseDocument = parseDocument;
    exports.stringify = stringify;
  }
});

// node_modules/yaml/dist/index.js
var require_dist = __commonJS({
  "node_modules/yaml/dist/index.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var Schema = require_Schema();
    var errors = require_errors();
    var Alias = require_Alias();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var cst = require_cst();
    var lexer = require_lexer();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    var publicApi = require_public_api();
    var visit = require_visit();
    exports.Composer = composer.Composer;
    exports.Document = Document.Document;
    exports.Schema = Schema.Schema;
    exports.YAMLError = errors.YAMLError;
    exports.YAMLParseError = errors.YAMLParseError;
    exports.YAMLWarning = errors.YAMLWarning;
    exports.Alias = Alias.Alias;
    exports.isAlias = identity.isAlias;
    exports.isCollection = identity.isCollection;
    exports.isDocument = identity.isDocument;
    exports.isMap = identity.isMap;
    exports.isNode = identity.isNode;
    exports.isPair = identity.isPair;
    exports.isScalar = identity.isScalar;
    exports.isSeq = identity.isSeq;
    exports.Pair = Pair.Pair;
    exports.Scalar = Scalar.Scalar;
    exports.YAMLMap = YAMLMap.YAMLMap;
    exports.YAMLSeq = YAMLSeq.YAMLSeq;
    exports.CST = cst;
    exports.Lexer = lexer.Lexer;
    exports.LineCounter = lineCounter.LineCounter;
    exports.Parser = parser.Parser;
    exports.parse = publicApi.parse;
    exports.parseAllDocuments = publicApi.parseAllDocuments;
    exports.parseDocument = publicApi.parseDocument;
    exports.stringify = publicApi.stringify;
    exports.visit = visit.visit;
    exports.visitAsync = visit.visitAsync;
  }
});

// src/bin/aiplus-office.ts
import * as fs11 from "node:fs";
import { fileURLToPath as fileURLToPath3 } from "node:url";

// src/exec.ts
import { execFile, spawn as nodeSpawn } from "node:child_process";
function spawn(command, args = [], options = {}) {
  return nodeSpawn(command, args, { windowsHide: true, ...options });
}
function execFileAsync(file, args = [], options = {}) {
  return new Promise((resolve6, reject) => {
    execFile(file, args, { encoding: "utf8", windowsHide: true, ...options }, (err2, stdout, stderr) => {
      if (err2) reject(Object.assign(err2, { stdout, stderr }));
      else resolve6({ stdout, stderr });
    });
  });
}

// src/mcp-proxy.ts
import * as fs3 from "node:fs";
import * as os2 from "node:os";
import * as path3 from "node:path";
import * as readline from "node:readline";

// src/mcp-gateway.ts
import * as fs from "node:fs";
import * as path from "node:path";
var GRID_TOOLS = [
  "execute_command",
  "list_commands",
  "inspect_workbook",
  "read_range",
  "write_range",
  "set_cell",
  "get_cell",
  "evaluate_formula",
  "select",
  "format_range",
  "insert_chart",
  "create_table",
  "sort_range",
  "filter",
  "open_workbook",
  "save_workbook",
  "new_workbook",
  "undo",
  "redo",
  "list_functions"
];
var EXEC_NAMESPACES = [
  "arrange",
  "cell",
  "chart",
  "data",
  "document",
  "draw",
  "edit",
  "file",
  "formulas",
  "history",
  "home",
  "insert",
  "object",
  "pageLayout",
  "pivot",
  "range",
  "review",
  "selection",
  "shape",
  "sheet",
  "slicer",
  "table",
  "view"
];
var FILE_COMMANDS = [
  "file.new",
  "file.open",
  "file.save",
  "file.saveAs",
  "file.saveBytes",
  "file.close",
  "file.exportCsv",
  "file.exportHtml",
  "file.exportPdf",
  "file.properties",
  "file.options",
  "file.printPreview"
];
var DENIED_COMMANDS = ["view.newWindow", "file.print"];
var FOREIGN_PATH_KEYS = ["file", "files", "filename", "filepath", "dir", "directory", "folder", "url", "uri", "href"];
var GATEWAY_METHODS = [
  "initialize",
  "ping",
  "tools/list",
  "tools/call",
  "resources/list",
  "resources/templates/list",
  "resources/read",
  "prompts/list",
  "prompts/get"
];
function methodPolicy(method, id, params) {
  if (typeof method !== "string") return "forward";
  if (id === void 0) return method.startsWith("notifications/") ? "forward" : "drop";
  if (!GATEWAY_METHODS.includes(method)) return "reject";
  if (method === "resources/read") {
    const uri = params?.uri;
    return typeof uri === "string" && uri.startsWith("gridcraft://") ? "forward" : "reject";
  }
  return "forward";
}
var GatewayRefusal = class extends Error {
  name = "GatewayRefusal";
};
function refusalText(hu, en) {
  return `${hu} English: ${en}`;
}
function samePathPrefix(root, candidate, platform) {
  const norm = (p) => platform === "win32" ? p.toLowerCase() : p;
  const r = norm(root);
  const c = norm(candidate);
  if (c === r) return true;
  const withSep = r.endsWith(path.sep) ? r : r + path.sep;
  return c.startsWith(withSep);
}
function confinePath(root, p, platform = process.platform) {
  if (typeof p !== "string" || p.trim() === "") {
    throw new GatewayRefusal(refusalText("Hi\xE1nyzik a f\xE1jl el\xE9r\xE9si \xFAtja.", "the file path is missing."));
  }
  if (p.includes("\0")) throw new GatewayRefusal(refusalText("\xC9rv\xE9nytelen el\xE9r\xE9si \xFAt.", "invalid path."));
  const realRoot = fs.realpathSync(root);
  const abs = path.resolve(realRoot, p);
  const tail = [];
  let cur = abs;
  let real;
  for (; ; ) {
    let st;
    try {
      st = fs.lstatSync(cur);
    } catch {
      st = void 0;
    }
    if (st) {
      try {
        real = fs.realpathSync(cur);
      } catch {
        throw outside(realRoot, p);
      }
      break;
    }
    const parent = path.dirname(cur);
    if (parent === cur) break;
    tail.unshift(path.basename(cur));
    cur = parent;
  }
  const candidate = real === void 0 ? abs : path.join(real, ...tail);
  if (!samePathPrefix(realRoot, candidate, platform)) throw outside(realRoot, p);
  return candidate;
}
function outside(root, p) {
  return new GatewayRefusal(
    refusalText(
      `Ez a f\xE1jl a megengedett mapp\xE1n k\xEDv\xFCl van, ez\xE9rt nem ny\xFAlok hozz\xE1: ${p}. A megengedett mappa: ${root}.`,
      `path refused, it is outside the allowed folder ${root}: ${p}.`
    )
  );
}
function confineParams(root, value, platform) {
  if (Array.isArray(value)) return value.map((v) => confineParams(root, v, platform));
  if (value === null || typeof value !== "object") return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (k === "path") out[k] = confinePath(root, v, platform);
    else if (FOREIGN_PATH_KEYS.includes(k.toLowerCase()) && v !== null && v !== false) {
      throw new GatewayRefusal(
        refusalText(`A(z) \u201E${k}\u201D param\xE9ter f\xE1jlt, mapp\xE1t vagy webc\xEDmet adna meg, ezt nem engedem.`, `parameter "${k}" would name a file, folder or URL; refused.`)
      );
    } else out[k] = confineParams(root, v, platform);
  }
  return out;
}
function commandRefusal(id) {
  if (typeof id !== "string" || !/^[A-Za-z][\w-]*(\.[\w-]+)+$/.test(id)) {
    return refusalText("Ismeretlen parancsazonos\xEDt\xF3.", "unknown command id.");
  }
  const ns = id.split(".")[0];
  const denied = DENIED_COMMANDS.includes(id) || !EXEC_NAMESPACES.includes(ns) || ns === "file" && !FILE_COMMANDS.includes(id);
  if (!denied) return void 0;
  return refusalText(
    `A(z) ${id} parancsot ez a kapcsolat nem futtatja (weblinket nyitna, szkriptet futtatna, ablakot vagy nyomtat\xE1st ind\xEDtana, vagy nem ismert).`,
    `command ${id} is not run through this connection (it would open a link, run a script, open a window or print, or it is unknown).`
  );
}
function createGateway(appName, root, platform = process.platform) {
  const allowed = new Set(GRID_TOOLS);
  return {
    root,
    check(name, args) {
      if (typeof name !== "string" || !allowed.has(name)) {
        return {
          ok: false,
          message: refusalText(
            `A(z) ${String(name)} eszk\xF6zt ez a kapcsolat nem k\xEDn\xE1lja (a ${appName} ablak\xE1t ig\xE9nyli, vagy nem ismert).`,
            `tool ${String(name)} is not offered through this connection (it needs the ${appName} window, or it is unknown).`
          )
        };
      }
      const a = args && typeof args === "object" && !Array.isArray(args) ? args : {};
      try {
        if (name === "execute_command") {
          const why = commandRefusal(a.command);
          if (why) return { ok: false, message: why };
          const params = a.params === void 0 ? void 0 : confineParams(root, a.params, platform);
          return { ok: true, arguments: params === void 0 ? { ...a } : { ...a, params } };
        }
        return { ok: true, arguments: confineParams(root, a, platform) };
      } catch (e) {
        if (e instanceof GatewayRefusal) return { ok: false, message: e.message };
        throw e;
      }
    },
    filterToolList(result2) {
      const r = result2;
      if (!r || !Array.isArray(r.tools)) return result2;
      return { ...r, tools: r.tools.filter((t) => typeof t?.name === "string" && allowed.has(t.name)) };
    },
    annotateInitialize(result2) {
      const r = result2;
      if (!r || typeof r !== "object") return result2;
      const note = `Files: only inside ${root}; a relative path is resolved against it (aiplus-office checks every path). execute_command does not run link.*, automate.*, window or print commands.`;
      const base = typeof r.instructions === "string" ? `${r.instructions}

` : "";
      return { ...r, instructions: `${base}${note}` };
    }
  };
}

// src/provision.ts
import { createHash } from "node:crypto";
import * as fs2 from "node:fs";
import * as os from "node:os";
import * as path2 from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

// src/registry.ts
var APP_IDS = ["wordcraft", "gridcraft", "deckcraft", "pdfcraft"];
var HOSTS_MACOS = ["darwin/x64", "darwin/arm64"];
var LINUX = { "linux/x64": "x86_64", "linux/arm64": "aarch64", "linux/riscv64": "riscv64" };
var WINDOWS = { "win32/x64": "x64", "win32/arm64": "arm64", "win32/ia32": "x86" };
function standardAssets(id) {
  const out = {};
  for (const h of HOSTS_MACOS) out[h] = [`${id}-cli-{v}-macos-universal.zip`];
  for (const [h, arch] of Object.entries(LINUX)) out[h] = [`${id}-cli-{v}-linux-${arch}.tar.gz`, `${id}-{v}-linux-${arch}.tar.gz`];
  for (const [h, arch] of Object.entries(WINDOWS)) out[h] = [`${id}-{v}-windows-${arch}-portable.zip`];
  out["freebsd/x64"] = [`${id}-{v}-freebsd-x86_64.tar.gz`];
  return out;
}
function app(id, name, purpose, dialect, mcp, glibcMin = [2, 35]) {
  return { id, name, purpose, repo: `storytold/${id}`, cli: `${id}-cli`, assets: standardAssets(id), dialect, mcp, glibcMin };
}
var COMMANDS_JSON = ["commands", "--json"];
var WORDCRAFT_HU = "itlinekft/wordcraft";
var WORDCRAFT_HU_REPOS = { "win32/x64": WORDCRAFT_HU, "darwin/x64": WORDCRAFT_HU, "darwin/arm64": WORDCRAFT_HU };
var CRAFT_APPS = [
  {
    ...app(
      "wordcraft",
      "WordCraft",
      "word processing: DOCX/ODT/RTF documents, conversion, PDF export",
      { list: COMMANDS_JSON, run: "run [--file F] --cmd 'id={json}'\u2026 [--save OUT] | convert | render | text" },
      { confinement: "automation-roots", toolClass: "small", tools: 16, bridgeFlag: "--connect" }
    ),
    hostRepos: WORDCRAFT_HU_REPOS
  },
  app(
    "gridcraft",
    "GridCraft",
    "spreadsheets: formulas, evaluation, conversion",
    { list: COMMANDS_JSON, run: "run [--in FILE] --cmd 'id={json}'\u2026 [--out FILE] | eval | check | convert" },
    // gridcraft-cli mcp (0.12.1) has no root option: the proxy confines it and lists 20 of its 21 tools (no `screenshot`).
    { confinement: "gateway", toolClass: "small", tools: 20, bridgeFlag: "--connect" }
  ),
  app(
    "deckcraft",
    "DeckCraft",
    "presentation slides and export",
    { list: ["commands"], describe: ["describe", "<id>"], run: "run [--in FILE] [--cmd ID[=JSON]\u2026] [--save OUT] [--export OUT] | render | convert" },
    // --automation-read-root/--automation-write-root measured on 0.10.0 and 0.11.1 (2026-10-25).
    { confinement: "automation-roots", toolClass: "small", tools: 25, bridgeFlag: "--connect" }
  ),
  app(
    "pdfcraft",
    "PdfCraft",
    "PDF combine, split, extract, edit, render and audit",
    { list: ["tools"], run: "<combine|split|extract|edit|render|text|audit> \u2026 | run" },
    { confinement: "root", compactFlag: "--compact", toolClass: "large", tools: 175 }
    // 175 measured on 0.13.0 (upstream: 163)
  )
];
var BY_ID = new Map(CRAFT_APPS.map((a) => [a.id, a]));
function isAppId(id) {
  return BY_ID.has(id);
}
function getApp(id) {
  const found = BY_ID.get(id);
  if (!found) throw new UnknownAppError(id);
  return found;
}
var UnknownAppError = class extends Error {
  name = "UnknownAppError";
  constructor(id) {
    super(`unknown craft app "${id}"; supported apps: ${APP_IDS.join(", ")}`);
  }
};
function envPrefix(app2) {
  return `AIPLUS_OFFICE_${app2.id.toUpperCase()}`;
}
function binName(app2, platform) {
  return platform === "win32" ? `${app2.cli}.exe` : app2.cli;
}
function desktopName(app2, platform) {
  return platform === "win32" ? `${app2.id}.exe` : app2.id;
}
function repoFor(app2, platform, arch) {
  const key = hostKey(platform, arch);
  return key && app2.hostRepos?.[key] || app2.repo;
}
function hostKey(platform, arch) {
  const key = `${platform}/${arch}`;
  return key in standardAssets("x") ? key : void 0;
}

// src/provision.ts
var API_BASE = "https://api.github.com";
var LATEST_TTL_MS = 24 * 60 * 60 * 1e3;
var STALE_STAGING_MS = 60 * 60 * 1e3;
var SUMS_NAME = "SHA256SUMS.txt";
var ProvisionError = class extends Error {
  name = "ProvisionError";
};
var DEFAULT_DOWNLOAD = { stallMs: 45e3, retryDelaysMs: [2e3, 5e3, 1e4] };
function defaultDeps() {
  return {
    env: process.env,
    platform: process.platform,
    arch: process.arch,
    fetch: (...a) => fetch(...a),
    now: () => Date.now(),
    homedir: () => os.homedir(),
    exec: (file, args, opts) => execFileAsync(file, args, { maxBuffer: 64 * 1024 * 1024, ...opts }),
    glibcVersion: () => {
      const report = process.report?.getReport();
      return report?.header?.glibcVersionRuntime;
    },
    log: (m) => process.stderr.write(`${m}
`),
    apiBase: API_BASE,
    probeVersion: false,
    randomId: () => Math.random().toString(36).slice(2, 10),
    preferInstalled: false,
    download: DEFAULT_DOWNLOAD
  };
}
function assetCandidates(app2, platform, arch, version) {
  const key = hostKey(platform, arch);
  const patterns = key ? app2.assets[key] : void 0;
  if (!patterns?.length) {
    throw new ProvisionError(
      `unsupported platform: ${platform}/${arch} has no ${app2.name} CLI release asset; set ${envPrefix(app2)}_BIN to a self-built ${app2.cli}`
    );
  }
  return patterns.map((p) => p.replaceAll("{v}", version));
}
function assertLibc(app2, deps) {
  if (deps.platform !== "linux") return;
  const [fMaj, fMin] = app2.glibcMin;
  const floor = `${fMaj}.${fMin}`;
  const hint = `Set ${envPrefix(app2)}_BIN to a compatible ${app2.cli}`;
  const v = deps.glibcVersion();
  if (v === void 0) {
    throw new ProvisionError(`unsupported C library: musl (not glibc); the ${app2.name} CLI needs glibc \u2265 ${floor}. ${hint}`);
  }
  const [maj, min] = v.split(".").map((n) => Number.parseInt(n, 10));
  if (maj < fMaj || maj === fMaj && (min ?? 0) < fMin) {
    throw new ProvisionError(`unsupported C library: glibc ${v}; the ${app2.name} CLI needs glibc \u2265 ${floor}. ${hint}`);
  }
}
function craftRoot(deps) {
  if (deps.env.AIPLUS_OFFICE_HOME) return path2.resolve(deps.env.AIPLUS_OFFICE_HOME);
  const platform = deps.platform ?? process.platform;
  if (platform === "win32") return path2.join(deps.env.LOCALAPPDATA || path2.join(deps.homedir(), "AppData", "Local"), "aiplus-office");
  if (platform === "darwin") return path2.join(deps.homedir(), "Library", "Caches", "aiplus-office");
  const xdg = deps.env.XDG_CACHE_HOME;
  return path2.join(xdg && path2.isAbsolute(xdg) ? xdg : path2.join(deps.homedir(), ".cache"), "aiplus-office");
}
function cacheRoot(app2, deps) {
  return path2.join(craftRoot(deps), app2.id);
}
function normaliseVersion(raw, appName = "craft app") {
  const v = raw.trim().replace(/^v/, "");
  if (!/^[0-9A-Za-z][0-9A-Za-z._+-]*$/.test(v) || v.includes("..")) {
    throw new ProvisionError(`invalid ${appName} version "${raw}"`);
  }
  return v;
}
function semverParts(v) {
  return v.split(/[.+-]/).slice(0, 3).map((n) => Number.parseInt(n, 10) || 0);
}
function compareSemver(a, b) {
  const pa = semverParts(a);
  const pb = semverParts(b);
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  return 0;
}
function validBinary(file, platform) {
  try {
    const st = fs2.statSync(file);
    if (!st.isFile() || st.size === 0) return false;
    return platform === "win32" || (st.mode & 73) !== 0;
  } catch {
    return false;
  }
}
function subdirs(dir) {
  try {
    return fs2.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory() && e.name !== "__MACOSX").map((e) => e.name);
  } catch {
    return [];
  }
}
function findByBasename(dir, name, out = []) {
  let entries;
  try {
    entries = fs2.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name === "__MACOSX") continue;
    const p = path2.join(dir, e.name);
    if (e.isDirectory()) findByBasename(p, name, out);
    else if (e.isFile() && e.name === name) out.push(p);
  }
  return out;
}
function locateBinary(app2, tree, platform, assetName) {
  const name = binName(app2, platform);
  const rel = platform === "linux" || platform === "freebsd" ? path2.join("bin", name) : name;
  for (const base of [tree, ...subdirs(tree).map((d) => path2.join(tree, d))]) {
    const p = path2.join(base, rel);
    try {
      if (fs2.statSync(p).isFile()) return p;
    } catch {
    }
  }
  const found = findByBasename(tree, name);
  if (found.length > 1) {
    throw new ProvisionError(`ambiguous archive: ${found.length} files named ${name} in ${assetName}`);
  }
  return found[0];
}
function parseSums(text, assetName) {
  const digests = [];
  for (const raw of text.split("\n")) {
    const m = /^([0-9a-fA-F]{64})\s+\*?(?:\.\/)?(.+?)\s*$/.exec(raw.replace(/\r$/, ""));
    if (m && m[2] === assetName) digests.push(m[1].toLowerCase());
  }
  if (digests.length === 0) throw new ProvisionError(`${SUMS_NAME} has no entry for ${assetName}`);
  if (digests.length > 1) throw new ProvisionError(`${SUMS_NAME} has ${digests.length} entries for ${assetName}`);
  return digests[0];
}
var MODE_RE = /^[-dlhcbps][-rwxsStTl+@.]{9}/;
function assertSafeListing(names, verbose) {
  if (names.length !== verbose.length) {
    throw new ProvisionError(
      `archive listing mismatch (${names.length} names vs ${verbose.length} detailed entries); refusing to extract`
    );
  }
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const line = verbose[i];
    if (!MODE_RE.test(line)) throw new ProvisionError("archive listing not understood; refusing to extract");
    const type = line[0];
    if (type !== "-" && type !== "d") {
      throw new ProvisionError(`archive entry "${name}" is not a regular file or directory (type "${type}"); refusing to extract`);
    }
    const segments2 = name.split(/[\\/]/);
    if (name.startsWith("/") || name.startsWith("\\") || /^[A-Za-z]:/.test(name) || segments2.includes("..")) {
      throw new ProvisionError(`archive entry "${name}" escapes the install directory; refusing to extract`);
    }
  }
}
function lines(out) {
  const text = out.toString();
  const l = text.split("\n").map((s) => s.replace(/\r$/, ""));
  while (l.length && l[l.length - 1] === "") l.pop();
  return l;
}
function exe(name, platform = process.platform) {
  return platform === "win32" ? `${name}.exe` : name;
}
function assertTreeSafe(tree) {
  const walk = (dir) => {
    for (const e of fs2.readdirSync(dir, { withFileTypes: true })) {
      const p = path2.join(dir, e.name);
      const st = fs2.lstatSync(p);
      if (st.isDirectory()) walk(p);
      else if (!st.isFile()) {
        throw new ProvisionError(`extracted entry "${path2.relative(tree, p)}" is not a regular file or directory; refusing to install`);
      }
    }
  };
  walk(tree);
}
function systemTar(platform, env) {
  if (platform !== "win32") return exe("tar", platform);
  return path2.win32.join(env.SystemRoot || env.SYSTEMROOT || "C:\\Windows", "System32", exe("tar", platform));
}
async function listArchive(deps, archive) {
  const tar = systemTar(deps.platform, deps.env);
  const names = lines((await deps.exec(tar, ["-tf", archive])).stdout);
  const verbose = lines((await deps.exec(tar, ["-tvf", archive])).stdout);
  assertSafeListing(names, verbose);
}
async function extractArchive(deps, archive, dest) {
  if (deps.platform === "darwin") await deps.exec("ditto", ["-x", "-k", archive, dest]);
  else await deps.exec(systemTar(deps.platform, deps.env), ["-xf", archive, "-C", dest]);
}
var UA = "aiplus-office";
async function apiJson(deps, url) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": UA };
  if (deps.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${deps.env.GITHUB_TOKEN}`;
  let res;
  try {
    res = await deps.fetch(url, { headers, signal: AbortSignal.timeout(3e4) });
  } catch (e) {
    throw new ProvisionError(`GitHub API request failed: ${e.message}`);
  }
  if (!res.ok) throw new ProvisionError(`GitHub API returned HTTP ${res.status} for ${url}`);
  return await res.json();
}
var MAX_SUMS_BYTES = 1024 * 1024;
var MAX_ASSET_BYTES = 2 * 1024 * 1024 * 1024;
async function downloadText(deps, url) {
  const res = await deps.fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(6e4) });
  if (!res.ok) throw new ProvisionError(`download of ${SUMS_NAME} failed: HTTP ${res.status}`);
  const text = await res.text();
  if (text.length > MAX_SUMS_BYTES) throw new ProvisionError(`${SUMS_NAME} is larger than ${MAX_SUMS_BYTES} bytes; refusing`);
  return text;
}
function fileSize(file) {
  try {
    return fs2.statSync(file).size;
  } catch {
    return 0;
  }
}
async function sha256File(file) {
  const hash = createHash("sha256");
  for await (const chunk of fs2.createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}
async function fetchOnce(deps, url, dest, offset, maxBytes, stallMs) {
  const ctrl = new AbortController();
  let timer;
  const arm = () => {
    clearTimeout(timer);
    timer = setTimeout(() => ctrl.abort(new Error(`no data for ${Math.round(stallMs / 1e3)} s`)), stallMs);
  };
  arm();
  try {
    const headers = { "User-Agent": UA };
    if (offset > 0) headers.Range = `bytes=${offset}-`;
    const res = await deps.fetch(url, { headers, signal: ctrl.signal });
    if (res.status === 416 && offset > 0) {
      fs2.rmSync(dest, { force: true });
      throw new Error("HTTP 416 for the resumed range; starting over");
    }
    if (!res.ok || !res.body) {
      const msg = `asset download failed: HTTP ${res.status} for ${url}`;
      if (res.status >= 500 || res.status === 429) throw new Error(msg);
      throw new ProvisionError(msg);
    }
    const append = offset > 0 && res.status === 206;
    let received = append ? offset : 0;
    await pipeline(
      Readable.fromWeb(res.body),
      async function* (src) {
        for await (const chunk of src) {
          arm();
          received += chunk.length;
          if (received > maxBytes) throw new ProvisionError(`download exceeds ${maxBytes} bytes; aborting (${url})`);
          yield chunk;
        }
      },
      fs2.createWriteStream(dest, { flags: append ? "a" : "w" })
    );
  } catch (e) {
    if (ctrl.signal.aborted && !(e instanceof ProvisionError)) throw ctrl.signal.reason;
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
async function downloadFile(deps, url, dest, maxBytes = MAX_ASSET_BYTES) {
  const policy = deps.download ?? DEFAULT_DOWNLOAD;
  fs2.rmSync(dest, { force: true });
  for (let attempt = 0; ; attempt++) {
    try {
      await fetchOnce(deps, url, dest, fileSize(dest), maxBytes, policy.stallMs);
      break;
    } catch (e) {
      if (e instanceof ProvisionError) throw e;
      const reason = e.message;
      if (attempt >= policy.retryDelaysMs.length) {
        throw new ProvisionError(`asset download failed after ${attempt + 1} attempts (${reason}): ${url}`);
      }
      const delay = policy.retryDelaysMs[attempt];
      deps.log(
        `[aiplus-office] download interrupted at ${(fileSize(dest) / 1048576).toFixed(1)} MB (${reason}); resuming in ${Math.round(delay / 1e3)} s`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return sha256File(dest);
}
async function downloadVerified(deps, release, assetName, dest, repo) {
  const tag = release.tag_name;
  const assetInfo = release.assets.find((a) => a.name === assetName);
  if (!assetInfo) throw new ProvisionError(`release ${tag} has no asset named ${assetName}`);
  const sumsInfo = release.assets.find((a) => a.name === SUMS_NAME);
  if (!sumsInfo) throw new ProvisionError(`release ${tag} has no ${SUMS_NAME}; refusing to install an unverified binary`);
  if (repo && deps.apiBase === API_BASE) {
    const prefix = `https://github.com/${repo}/releases/download/`;
    for (const info of [assetInfo, sumsInfo]) {
      if (!info.browser_download_url.startsWith(prefix)) {
        throw new ProvisionError(`release ${tag}: ${info.name} points outside ${prefix}; refusing`);
      }
    }
  }
  const expected = parseSums(await downloadText(deps, sumsInfo.browser_download_url), assetName);
  const size = assetInfo.size ? ` (${(assetInfo.size / 1048576).toFixed(0)} MB)` : "";
  deps.log(`[aiplus-office] downloading ${tag} ${assetName}${size}`);
  const cap = assetInfo.size ? assetInfo.size + 1024 * 1024 : MAX_ASSET_BYTES;
  const actual = await downloadFile(deps, assetInfo.browser_download_url, dest, cap);
  if (actual !== expected) {
    fs2.rmSync(dest, { force: true });
    throw new ProvisionError(`checksum mismatch for ${assetName}: expected ${expected}, got ${actual}`);
  }
}
function readLatestCache(root, now, repo) {
  try {
    const rec = JSON.parse(fs2.readFileSync(path2.join(root, "latest.json"), "utf8"));
    if (typeof rec.tag !== "string" || typeof rec.checkedAt !== "number" || rec.repo !== repo) return void 0;
    if (rec.checkedAt > now || now - rec.checkedAt >= LATEST_TTL_MS) return void 0;
    return rec.tag;
  } catch {
    return void 0;
  }
}
function installedVersions(app2, root, platform) {
  return subdirs(root).filter((d) => /^\d+\.\d+\.\d+[0-9A-Za-z._+-]*$/.test(d) && !d.includes("..")).filter((d) => cachedBinary(app2, path2.join(root, d), platform) !== void 0).sort((a, b) => compareSemver(b, a));
}
async function resolveVersion(app2, deps, root) {
  const prefix = envPrefix(app2);
  const pin = deps.env[`${prefix}_VERSION`]?.trim();
  if (pin) return { version: normaliseVersion(pin, app2.name), source: "pin" };
  const repo = repoFor(app2, deps.platform, deps.arch);
  const cached = readLatestCache(root, deps.now(), repo);
  if (cached) return { version: normaliseVersion(cached, app2.name), source: "latest-cached" };
  try {
    const release = await apiJson(deps, `${deps.apiBase}/repos/${repo}/releases/latest`);
    const version = normaliseVersion(release.tag_name, app2.name);
    try {
      fs2.mkdirSync(root, { recursive: true });
      fs2.writeFileSync(path2.join(root, "latest.json"), JSON.stringify({ tag: release.tag_name, checkedAt: deps.now(), repo }));
    } catch {
    }
    return { version, source: "latest", release };
  } catch (e) {
    const reason = e.message;
    const installed = installedVersions(app2, root, deps.platform);
    if (installed.length > 0) {
      deps.log(`[aiplus-office] warning: ${app2.id}: latest-release lookup failed (${reason}); using installed ${installed[0]}`);
      return { version: installed[0], source: "fallback-installed" };
    }
    throw new ProvisionError(
      `${reason}. No ${app2.name} version is installed; set GITHUB_TOKEN (rate limit), ${prefix}_VERSION to pin a release, or ${prefix}_BIN to an existing ${app2.cli}`
    );
  }
}
async function probeBinaryVersion(deps, bin) {
  try {
    const out = (await deps.exec(bin, ["--version"], { timeout: 1e4 })).stdout.toString();
    return /\b(\d+\.\d+\.\d+[^\s]*)/.exec(out)?.[1] ?? null;
  } catch {
    return null;
  }
}
async function overrideReport(app2, deps, started) {
  const varName = `${envPrefix(app2)}_BIN`;
  const bin = deps.env[varName];
  let reason;
  try {
    const st = fs2.statSync(bin);
    if (!st.isFile()) reason = "not a file";
    else if (deps.platform !== "win32" && (st.mode & 73) === 0) reason = "not executable";
  } catch {
    reason = "not found";
  }
  if (reason) throw new ProvisionError(`${varName}=${bin}: ${reason}`);
  const version = deps.probeVersion ? await probeBinaryVersion(deps, bin) : null;
  return { app: app2.id, version, source: "override", asset: null, cacheHit: false, binary: path2.resolve(bin), durationMs: deps.now() - started };
}
var inflight = /* @__PURE__ */ new Map();
function singleFlight(key, run2) {
  if (inflight.has(key)) return inflight.get(key);
  const p = run2().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
function commitTree(tree, finalDir, verifyExisting) {
  try {
    fs2.renameSync(tree, finalDir);
    return false;
  } catch (e) {
    const code = e.code;
    if (code === "EEXIST" || code === "ENOTEMPTY" || code === "EPERM") {
      if (!verifyExisting(finalDir)) throw e;
      return true;
    }
    throw e;
  }
}
function installVerified(o) {
  return singleFlight(`install:${o.finalDir}`, async () => {
    const staging = path2.join(o.cacheDir, `.staging-${process.pid}-${o.deps.randomId()}`);
    try {
      const tree = path2.join(staging, "tree");
      fs2.mkdirSync(tree, { recursive: true });
      const archive = path2.join(staging, o.asset);
      await downloadVerified(o.deps, o.release, o.asset, archive, o.repo);
      await o.list(archive);
      await o.extract(archive, tree);
      assertTreeSafe(tree);
      const value = await o.validate(tree);
      const raced = commitTree(tree, o.finalDir, o.verifyExisting);
      return { raced, value: raced ? void 0 : value };
    } finally {
      fs2.rmSync(staging, { recursive: true, force: true });
    }
  });
}
function sweepStaleStaging(root, now) {
  let entries;
  try {
    entries = fs2.readdirSync(root);
  } catch {
    return;
  }
  for (const name of entries) {
    if (!name.startsWith(".staging-")) continue;
    const p = path2.join(root, name);
    try {
      if (now - fs2.statSync(p).mtimeMs > STALE_STAGING_MS) fs2.rmSync(p, { recursive: true, force: true });
    } catch {
    }
  }
}
function cachedBinary(app2, dir, platform) {
  try {
    const bin = locateBinary(app2, dir, platform, path2.basename(dir));
    return bin && validBinary(bin, platform) ? bin : void 0;
  } catch {
    return void 0;
  }
}
var ASSET_MARKER = ".aiplus-office-asset";
function readAssetMarker(versionDir) {
  try {
    return fs2.readFileSync(path2.join(versionDir, ASSET_MARKER), "utf8").trim() || void 0;
  } catch {
    return void 0;
  }
}
var REPO_MARKER = ".aiplus-office-repo";
function installedRepo(app2, versionDir) {
  try {
    return fs2.readFileSync(path2.join(versionDir, REPO_MARKER), "utf8").trim() || app2.repo;
  } catch {
    return app2.repo;
  }
}
async function provision(appOrId, partial = {}) {
  const app2 = typeof appOrId === "string" ? getApp(appOrId) : appOrId;
  const deps = { ...defaultDeps(), ...partial };
  const started = deps.now();
  if (deps.env[`${envPrefix(app2)}_BIN`]) return overrideReport(app2, deps, started);
  return provisionManaged(app2, deps, started);
}
async function provisionManaged(app2, deps, started) {
  assetCandidates(app2, deps.platform, deps.arch, "0.0.0");
  assertLibc(app2, deps);
  const root = cacheRoot(app2, deps);
  fs2.mkdirSync(root, { recursive: true });
  sweepStaleStaging(root, deps.now());
  const resolved = await resolveVersion(app2, deps, root);
  const { version } = resolved;
  const candidates = assetCandidates(app2, deps.platform, deps.arch, version);
  const versionDir = path2.join(root, version);
  const report = (binary2, cacheHit, asset2) => ({
    app: app2.id,
    version,
    source: resolved.source,
    asset: asset2,
    cacheHit,
    binary: binary2,
    durationMs: deps.now() - started
  });
  if (fs2.existsSync(versionDir)) {
    const hit = cachedBinary(app2, versionDir, deps.platform);
    if (hit) return report(hit, true, readAssetMarker(versionDir) ?? candidates[candidates.length - 1]);
    deps.log(`[aiplus-office] cache entry ${versionDir} is damaged; re-provisioning`);
    fs2.rmSync(versionDir, { recursive: true, force: true });
  }
  const repo = repoFor(app2, deps.platform, deps.arch);
  const useInstalled = (why, sameRepo = false) => {
    if (resolved.source === "pin") return void 0;
    const older = installedVersions(app2, root, deps.platform).filter(
      (v) => v !== version && (!sameRepo || installedRepo(app2, path2.join(root, v)) === repo)
    );
    if (older.length === 0) return void 0;
    const dir = path2.join(root, older[0]);
    const bin = cachedBinary(app2, dir, deps.platform);
    if (!bin) return void 0;
    deps.log(`[aiplus-office] ${app2.id}: ${why}; using installed ${older[0]}`);
    return {
      app: app2.id,
      version: older[0],
      source: "fallback-installed",
      asset: readAssetMarker(dir) ?? null,
      cacheHit: true,
      binary: bin,
      durationMs: deps.now() - started
    };
  };
  if (deps.preferInstalled) {
    const now = useInstalled(`${version} is available and is installed by the next command outside a connector`, true);
    if (now) return now;
  }
  const tag = `v${version}`;
  const release = resolved.release ?? await apiJson(deps, `${deps.apiBase}/repos/${repo}/releases/tags/${tag}`);
  const asset = candidates.find((c) => release.assets.some((a) => a.name === c));
  if (!asset) throw new ProvisionError(`release ${tag} has no asset named ${candidates.join(" or ")}`);
  let installed;
  try {
    installed = await installVerified({
      deps,
      repo,
      asset,
      release,
      cacheDir: root,
      finalDir: versionDir,
      list: (archive) => listArchive(deps, archive),
      extract: (archive, dest) => extractArchive(deps, archive, dest),
      validate: (tree) => {
        const located = locateBinary(app2, tree, deps.platform, asset);
        if (!located) throw new ProvisionError(`no ${binName(app2, deps.platform)} found in ${asset}`);
        const rel = path2.relative(tree, located);
        fs2.chmodSync(located, 493);
        fs2.rmSync(path2.join(path2.dirname(located), desktopName(app2, deps.platform)), { force: true });
        fs2.writeFileSync(path2.join(tree, ASSET_MARKER), `${asset}
`);
        fs2.writeFileSync(path2.join(tree, REPO_MARKER), `${repo}
`);
        return rel;
      },
      verifyExisting: (dir) => cachedBinary(app2, dir, deps.platform) !== void 0
    });
  } catch (e) {
    const fallback = useInstalled(`installing ${version} failed (${e.message})`);
    if (fallback) return fallback;
    throw e;
  }
  const binary = installed.raced ? cachedBinary(app2, versionDir, deps.platform) : path2.join(versionDir, installed.value);
  const out = report(binary, false, asset);
  if (deps.platform === "darwin") {
    try {
      await deps.exec("spctl", ["--assess", "--type", "install", binary]);
      out.gatekeeper = "accepted";
    } catch (e) {
      if (e.code !== "ENOENT") {
        out.gatekeeper = "rejected";
        deps.log(`[aiplus-office] warning: Gatekeeper rejected ${binary} (checksum verified; authenticity not claimed)`);
      }
    }
  }
  return out;
}

// src/mcp-proxy.ts
var REJECTED_OPTIONS = ["--bridge", "--connect", "--control-token", "--automation-read-root", "--automation-write-root"];
function mcpUsage(app2, prog = "aiplus-office") {
  const cmd = `${prog} ${app2.id} mcp`;
  const compact = app2.mcp.compactFlag ? " [--compact]" : "";
  return app2.mcp.confinement ? `usage: ${cmd} [--root <dir>]${compact}
       ${cmd} --register

Runs the ${app2.name} stdio MCP server confined to <dir> (default: the current
directory) for both reads and writes${app2.mcp.confinement === "gateway" ? ` (checked by ${prog}: ${app2.name}'s own server has no confinement)` : ""}. Register it in the project's
.mcp.json with --register (opt-in).${app2.mcp.compactFlag ? `
--compact lists only the helper tools (${app2.mcp.tools} tools otherwise); every command stays reachable.` : ""}` : `usage: ${cmd} --allow-unconfined${compact}
       ${cmd} --register --allow-unconfined${compact}

${app2.name}'s MCP server has no path confinement: it can read and write any
path the user can. Start or register it only with --allow-unconfined.`;
}
var CANCEL_GRACE_MS = 5e3;
var INIT_GRACE_MS = 2e3;
function defaultMcpDeps(app2) {
  return {
    prog: "aiplus-office",
    provision: (opts) => provision(app2, opts),
    spawn: (command, args, options) => spawn(command, args, options),
    stdin: process.stdin,
    stdout: process.stdout,
    stderr: (t) => process.stderr.write(t),
    cwd: () => process.cwd(),
    chatRoot: defaultChatRoot,
    onSignal: (signal, handler) => {
      process.on(signal, handler);
    },
    cancelGraceMs: CANCEL_GRACE_MS,
    initGraceMs: INIT_GRACE_MS,
    serverVersion: "0.0.0"
  };
}
function parseMcpArgs(argv) {
  let root;
  let noProject = false;
  let allowUnconfined = false;
  let compact = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") return { kind: "help" };
    if (a === "--allow-unconfined") {
      allowUnconfined = true;
    } else if (a === "--compact") {
      compact = true;
    } else if (a === "--root" || a.startsWith("--root=")) {
      const v = a === "--root" ? argv[++i] : a.slice("--root=".length);
      if (!v || v.startsWith("--")) return { kind: "error", message: "--root needs a directory" };
      if (v === "${CLAUDE_PROJECT_DIR}") {
        noProject = true;
        continue;
      }
      const unexpanded = /\$\{[^}]*\}?/.exec(v);
      if (unexpanded) return { kind: "error", message: `--root holds an unexpanded variable (${unexpanded[0]}): the client did not substitute it; refusing to start` };
      root = v;
    } else if (REJECTED_OPTIONS.includes(a.split("=")[0])) {
      return { kind: "error", message: `option ${a.split("=")[0]} is not supported: the proxy owns confinement and never attaches to a running desktop app` };
    } else {
      return { kind: "error", message: `unknown option for mcp: ${a}` };
    }
  }
  return { kind: "run", root, ...noProject ? { noProject } : {}, allowUnconfined, compact };
}
function defaultChatRoot(env = process.env, home = os2.homedir()) {
  if (env.AIPLUS_OFFICE_CHAT_ROOT) return env.AIPLUS_OFFICE_CHAT_ROOT;
  const candidates = [env.OneDrive ? path3.join(env.OneDrive, "Documents") : "", path3.join(home, "Documents")].filter(Boolean);
  const docs = candidates.find((d) => isDirectory(d)) ?? home;
  return path3.join(docs, "AI+ Iroda");
}
function isDirectory(p) {
  try {
    return fs3.statSync(p).isDirectory();
  } catch {
    return false;
  }
}
function sameId(a, b) {
  return a === b;
}
async function runMcp(app2, argv, partial = {}) {
  const deps = { ...defaultMcpDeps(app2), ...partial };
  const usage2 = mcpUsage(app2, deps.prog);
  const parsed = parseMcpArgs(argv);
  if (parsed.kind === "help") {
    deps.stderr(`${usage2}
`);
    return 0;
  }
  if (parsed.kind === "error") {
    deps.stderr(`${parsed.message}
${usage2}
`);
    return 1;
  }
  if (parsed.compact && !app2.mcp.compactFlag) {
    deps.stderr(`${deps.prog}: --compact is not supported by ${app2.name}'s MCP server
${usage2}
`);
    return 1;
  }
  const confined = app2.mcp.confinement !== false;
  if (!confined && !parsed.allowUnconfined) {
    deps.stderr(
      `${deps.prog}: ${app2.name}'s MCP server has no path confinement and can read and write any path the user can; refusing to start. Pass --allow-unconfined to accept that, or use the bash route (${deps.prog} ${app2.id} exec \u2026).
${usage2}
`
    );
    return 1;
  }
  if (!confined && parsed.root !== void 0) {
    deps.stderr(`${deps.prog}: --root has no effect: ${app2.name}'s MCP server cannot confine paths
${usage2}
`);
    return 1;
  }
  let spawnArgs;
  let gateway;
  if (confined) {
    let root = path3.resolve(deps.cwd(), parsed.root ?? ".");
    if (parsed.noProject) {
      root = deps.chatRoot();
      try {
        fs3.mkdirSync(root, { recursive: true });
      } catch (e) {
        deps.stderr(`${deps.prog}: cannot create the chat folder ${root}: ${e.message}
`);
        return 1;
      }
      deps.stderr(`[${deps.prog}] no project folder from the client (plain Chat): files go to ${root}
`);
    }
    deps.stderr(`[${deps.prog}] mcp root: ${root}
`);
    if (app2.mcp.confinement === "gateway") {
      if (!isDirectory(root)) {
        deps.stderr(`${deps.prog}: the mcp root ${root} is not an existing folder; refusing to start
`);
        return 1;
      }
      gateway = createGateway(app2.name, root);
      deps.stderr(`[${deps.prog}] ${app2.name}: files confined by ${deps.prog} to ${root}
`);
      spawnArgs = ["mcp"];
    } else spawnArgs = app2.mcp.confinement === "root" ? ["mcp", "--root", root] : ["mcp", "--automation-read-root", root, "--automation-write-root", root];
  } else {
    deps.stderr(`[${deps.prog}] warning: ${app2.name}'s MCP server is unconfined \u2014 it can read and write any path the user can
`);
    spawnArgs = ["mcp"];
  }
  if (parsed.compact && app2.mcp.compactFlag) spawnArgs.push(app2.mcp.compactFlag);
  return new Promise((resolveRun) => {
    let finished = false;
    const finish = (code) => {
      if (finished) return;
      finished = true;
      resolveRun(code);
    };
    const toClient = (o) => deps.stdout.write(`${JSON.stringify(o)}
`);
    const log = (text) => deps.stderr(`[${deps.prog}] ${app2.id}: ${text}
`);
    let state = { kind: "pending" };
    const buffered = [];
    let eof = false;
    let local = false;
    let wentLocal = false;
    let clientInit;
    let initForwarded = false;
    let initAnswered = false;
    let gate;
    let graceTimer;
    let exitOverride;
    let child;
    let server;
    const startedAt = Date.now();
    const seconds = () => Math.round((Date.now() - startedAt) / 1e3);
    const statusTool = `${app2.id}_status`;
    const failedText = (message) => refusalText(
      `A(z) ${app2.name} let\xF6lt\xE9se nem siker\xFClt, ez\xE9rt ez az eszk\xF6z most nem fut. \xDAj munkamenetben \xFAjra megpr\xF3b\xE1lom. A hiba: ${message}`,
      `downloading ${app2.name} failed, so this tool cannot run now; a new session tries again. The error: ${message}`
    );
    const statusText = () => {
      if (state.kind === "failed") return failedText(state.message);
      if (!local && server) {
        return refusalText(
          `A(z) ${app2.name} k\xE9sz, az eszk\xF6zei el\xE9rhet\u0151k. Ha nem l\xE1tszanak, ind\xEDts \xFAj munkamenetet.`,
          `${app2.name} is ready and its tools are available. If they do not show, start a new session.`
        );
      }
      if (state.kind === "ready") {
        return refusalText(`A(z) ${app2.name} indul (${seconds()} m\xE1sodperce), p\xE1r perc m\xFAlva pr\xF3b\xE1ld \xFAjra.`, `${app2.name} is starting (for ${seconds()} s); try again in a few minutes.`);
      }
      return refusalText(
        `A(z) ${app2.name} let\xF6lt\xE9se folyamatban (${seconds()} m\xE1sodperce), p\xE1r perc m\xFAlva pr\xF3b\xE1ld \xFAjra.`,
        `${app2.name} is being downloaded (for ${seconds()} s); try again in a few minutes.`
      );
    };
    const notReadyText = () => state.kind === "failed" ? failedText(state.message) : state.kind === "ready" ? refusalText(`A(z) ${app2.name} indul, p\xE1r perc m\xFAlva pr\xF3b\xE1ld \xFAjra.`, `${app2.name} is starting; try again in a few minutes.`) : refusalText(`A(z) ${app2.name} let\xF6lt\xE9se folyamatban, p\xE1r perc m\xFAlva pr\xF3b\xE1ld \xFAjra.`, `${app2.name} is being downloaded; try again in a few minutes.`);
    const initializeResult = (params) => {
      const requested = params?.protocolVersion;
      const protocolVersion = typeof requested === "string" && PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[PROTOCOL_VERSIONS.length - 1];
      const instructions = state.kind === "failed" ? failedText(state.message) : refusalText(
        `A(z) ${app2.name} program let\xF6lt\xE9se vagy els\u0151 ind\xEDt\xE1sa folyamatban. Am\xEDg tart, az eszk\xF6zei nem futnak; a ${statusTool} eszk\xF6z megmutatja az \xE1llapotot. Ha k\xE9sz, az eszk\xF6z\xF6k megjelennek.`,
        `${app2.name} is being downloaded or started for the first time. Until it is ready its tools cannot run; ${statusTool} reports the state. When it is ready the tools appear.`
      );
      const result2 = { protocolVersion, capabilities: { tools: { listChanged: true } }, serverInfo: { name: `${deps.prog}-${app2.id}`, version: deps.serverVersion }, instructions };
      return gateway ? gateway.annotateInitialize(result2) : result2;
    };
    const statusToolDef = {
      name: statusTool,
      description: refusalText(`A(z) ${app2.name} let\xF6lt\xE9s\xE9nek \xE9s ind\xEDt\xE1s\xE1nak \xE1llapota.`, `the state of the ${app2.name} download and start.`),
      inputSchema: { type: "object", properties: {} }
    };
    const textResult = (text, isError) => ({ content: [{ type: "text", text }], isError });
    const localLine = (line) => {
      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        toClient({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error" } });
        return;
      }
      if (Array.isArray(msg) || msg === null || typeof msg !== "object") {
        toClient({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "batch requests are not supported by this server" } });
        return;
      }
      const { method, id, params } = msg;
      if (typeof method !== "string" || id === void 0) return;
      const reply = (result2) => toClient({ jsonrpc: "2.0", id, result: result2 });
      switch (method) {
        case "initialize":
          if (!clientInit) clientInit = { id, params };
          initAnswered = true;
          return reply(initializeResult(params));
        case "ping":
          return reply({});
        case "tools/list":
          return reply({ tools: [statusToolDef] });
        case "tools/call": {
          const name = params?.name;
          if (name === statusTool) return reply(textResult(statusText(), state.kind === "failed"));
          return reply(textResult(notReadyText(), true));
        }
        case "resources/list":
          return reply({ resources: [] });
        case "resources/templates/list":
          return reply({ resourceTemplates: [] });
        case "prompts/list":
          return reply({ prompts: [] });
        default:
          toClient({ jsonrpc: "2.0", id, error: { code: -32601, message: `method not available while ${app2.name} is not ready: ${method}` } });
      }
    };
    const goLocal = (why) => {
      clearTimeout(graceTimer);
      if (local || initAnswered || finished) return;
      local = true;
      wentLocal = true;
      log(`${why}; answering from ${deps.prog} until it is ready`);
      if (clientInit && initForwarded) {
        initAnswered = true;
        toClient({ jsonrpc: "2.0", id: clientInit.id, result: initializeResult(clientInit.params) });
      }
      for (const line of buffered.splice(0)) localLine(line);
    };
    let serverEofSent = false;
    const drain = () => {
      while (server && !local && gate === void 0 && buffered.length > 0) {
        const line = buffered.shift();
        const init = initRequest(line);
        if (init && !initForwarded) {
          initForwarded = true;
          gate = init.id;
        }
        server.line(line);
      }
      if (eof && server && !local && gate === void 0 && buffered.length === 0 && !serverEofSent) {
        serverEofSent = true;
        server.eof();
      }
    };
    const startServer = (bin, handshake) => {
      const c = deps.spawn(bin, spawnArgs, { stdio: ["pipe", "pipe", "inherit"] });
      child = c;
      let inflight2;
      let hasInflight = false;
      let passEof = false;
      const queue = [];
      const rewrite = /* @__PURE__ */ new Map();
      const toChild = (line) => {
        if (c.stdin && !c.stdin.destroyed) c.stdin.write(`${line}
`);
      };
      const maybeClose = () => {
        if (passEof && !hasInflight && queue.length === 0 && c.stdin && !c.stdin.destroyed) c.stdin.end();
      };
      const pump = () => {
        if (hasInflight) return;
        const next = queue.shift();
        if (!next) return maybeClose();
        hasInflight = true;
        inflight2 = next.id;
        toChild(next.raw);
      };
      c.stdin?.on("error", () => {
      });
      let cancelTimer;
      const onCancelled = (requestId, line) => {
        const queued = queue.findIndex((q) => sameId(q.id, requestId));
        if (queued >= 0) {
          queue.splice(queued, 1);
          return;
        }
        toChild(line);
        if (hasInflight && sameId(inflight2, requestId)) {
          clearTimeout(cancelTimer);
          cancelTimer = setTimeout(() => {
            if (!hasInflight || !sameId(inflight2, requestId)) return;
            hasInflight = false;
            inflight2 = void 0;
            pump();
          }, deps.cancelGraceMs);
          cancelTimer.unref();
        }
      };
      const passLine = (line) => {
        let msg;
        try {
          msg = JSON.parse(line);
        } catch {
          return toChild(line);
        }
        const single = msg && !Array.isArray(msg) ? msg : void 0;
        if (gateway && Array.isArray(msg)) {
          toClient({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "batch requests are not supported by this server" } });
          return;
        }
        if (wentLocal && single?.method === "tools/call" && single.id !== void 0 && single.params?.name === statusTool) {
          toClient({ jsonrpc: "2.0", id: single.id, result: textResult(statusText(), false) });
          return;
        }
        if (gateway && single) {
          const policy = methodPolicy(single.method, single.id, single.params);
          if (policy === "drop") return;
          if (policy === "reject") {
            toClient({ jsonrpc: "2.0", id: single.id, error: { code: -32601, message: `method not available through ${deps.prog}: ${String(single.method)}` } });
            return;
          }
          if (single.id !== void 0 && (single.method === "initialize" || single.method === "tools/list")) rewrite.set(single.id, single.method);
        }
        if (single?.method === "tools/call" && single.id !== void 0) {
          let raw = line;
          if (gateway) {
            const params = single.params ?? {};
            const decision = gateway.check(params.name, params.arguments);
            if (!decision.ok) {
              toClient({ jsonrpc: "2.0", id: single.id, result: { content: [{ type: "text", text: decision.message }], isError: true } });
              return;
            }
            raw = JSON.stringify({ ...single, params: { ...params, arguments: decision.arguments } });
          }
          queue.push({ raw, id: single.id });
          pump();
        } else if (single?.method === "notifications/cancelled" && single.jsonrpc === "2.0" && single.id === void 0 && // a notification carries no id; anything else passes through untouched
        single.params?.requestId !== void 0) {
          onCancelled(single.params.requestId, line);
        } else toChild(line);
      };
      server = {
        line: passLine,
        eof: () => {
          passEof = true;
          maybeClose();
        }
      };
      const serverRl = readline.createInterface({ input: c.stdout });
      serverRl.on("line", (line) => {
        let msg;
        try {
          msg = JSON.parse(line);
        } catch {
          deps.stderr(`${line}
`);
          return;
        }
        const isResponse = !!msg && !Array.isArray(msg) && msg.id !== void 0 && msg.method === void 0;
        const answersGate = gate !== void 0 && isResponse && sameId(msg?.id, gate);
        if (answersGate && local) {
          gate = void 0;
          rewrite.delete(msg?.id);
          const error = msg.error;
          if (error) log(`the server refused initialize (${String(error.message)}); passing through anyway`);
          toChild(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }));
          local = false;
          toClient({ jsonrpc: "2.0", method: "notifications/tools/list_changed" });
          log(`ready after ${seconds()} s; tools/list_changed sent`);
          drain();
          return;
        }
        if (answersGate) {
          gate = void 0;
          initAnswered = true;
          clearTimeout(graceTimer);
        }
        const pending = gateway && isResponse ? rewrite.get(msg?.id) : void 0;
        if (gateway && pending && msg) {
          rewrite.delete(msg.id);
          const result2 = msg.result;
          if (result2 !== void 0) toClient({ ...msg, result: pending === "tools/list" ? gateway.filterToolList(result2) : gateway.annotateInitialize(result2) });
          else deps.stdout.write(`${line}
`);
        } else deps.stdout.write(`${line}
`);
        if (hasInflight && msg && !Array.isArray(msg) && msg.id !== void 0 && sameId(msg.id, inflight2)) {
          hasInflight = false;
          inflight2 = void 0;
          pump();
        }
        if (answersGate) drain();
      });
      c.on("error", (e) => {
        deps.stderr(`${deps.prog}: failed to start ${app2.cli}: ${e.message}
`);
        finish(1);
      });
      c.on("exit", (code, signal) => {
        clearTimeout(cancelTimer);
        clearTimeout(graceTimer);
        clientRl.close();
        setImmediate(() => finish(exitOverride ?? (signal ? 1 : code ?? 1)));
      });
      if (handshake) {
        initForwarded = true;
        gate = HANDSHAKE_ID;
        toChild(JSON.stringify({ jsonrpc: "2.0", id: HANDSHAKE_ID, method: "initialize", params: clientInit?.params ?? DEFAULT_INIT_PARAMS }));
      } else drain();
    };
    const clientRl = readline.createInterface({ input: deps.stdin });
    clientRl.on("line", (line) => {
      if (line.trim() === "") return;
      if (local) return localLine(line);
      const init = initRequest(line);
      if (init && !clientInit) {
        clientInit = init;
        graceTimer = setTimeout(() => goLocal(`not ready ${deps.initGraceMs} ms after the client's initialize`), deps.initGraceMs);
        graceTimer.unref();
      }
      buffered.push(line);
      drain();
    });
    clientRl.on("close", () => {
      eof = true;
      if (local) {
        if (state.kind === "failed") finish(69);
        else if (state.kind === "pending") log("the client closed the connection; finishing the download before exit");
        else if (child && child.stdin && !child.stdin.destroyed) child.stdin.end();
      } else drain();
    });
    deps.onSignal("SIGINT", () => {
      exitOverride = 130;
      if (child) child.kill();
      else finish(130);
    });
    deps.onSignal("SIGTERM", () => {
      exitOverride = 143;
      if (child) child.kill();
      else finish(143);
    });
    deps.provision({ preferInstalled: true }).then(
      (report) => {
        state = { kind: "ready" };
        if (finished) return;
        if (!local) return startServer(report.binary, false);
        if (eof) {
          log("provisioned; the client is gone, so the server is not started");
          return finish(0);
        }
        log(`provisioned after ${seconds()} s; starting the server`);
        startServer(report.binary, true);
      },
      (e) => {
        const message = e?.message ?? String(e);
        state = { kind: "failed", message };
        deps.stderr(`${deps.prog}: ${message}
`);
        if (finished) return;
        goLocal("provisioning failed");
        if (eof) finish(69);
      }
    );
  });
}
var PROTOCOL_VERSIONS = ["2024-11-05", "2025-03-26", "2025-06-18", "2025-11-25"];
var HANDSHAKE_ID = "aiplus-office-lazy-start-initialize";
var DEFAULT_INIT_PARAMS = { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "aiplus-office", version: "0" } };
function initRequest(line) {
  try {
    const m = JSON.parse(line);
    return m && !Array.isArray(m) && m.method === "initialize" && m.id !== void 0 ? { id: m.id, params: m.params } : void 0;
  } catch {
    return void 0;
  }
}

// src/mcp-register.ts
import * as fs4 from "node:fs";
import * as path4 from "node:path";
import { fileURLToPath } from "node:url";
function defaultLauncherPath(name = "aiplus-office") {
  return fileURLToPath(new URL(`../cli/${name}`, import.meta.url));
}
function serverName(app2) {
  return `aiplus-office-${app2.id}`;
}
function isSymlink(p) {
  try {
    return fs4.lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}
function registerMcp(app2, partial = {}) {
  const deps = {
    cwd: process.cwd(),
    execPath: process.execPath,
    launcher: defaultLauncherPath(),
    prog: "aiplus-office",
    allowUnconfined: false,
    stderr: (t) => process.stderr.write(t),
    ...partial
  };
  if (deps.compact && !app2.mcp.compactFlag) {
    deps.stderr(`${deps.prog}: --compact is not supported by ${app2.name}'s MCP server
`);
    return 1;
  }
  if (app2.mcp.confinement === false && !deps.allowUnconfined) {
    deps.stderr(
      `${deps.prog}: ${app2.name}'s MCP server has no path confinement and can read and write any path the user can; refusing to register it. Pass --allow-unconfined to accept that.
`
    );
    return 1;
  }
  const file = path4.join(deps.cwd, ".mcp.json");
  if (isSymlink(file)) {
    deps.stderr(`${deps.prog}: ${file} is a symbolic link; refusing to write through it
`);
    return 1;
  }
  const looksLikeRoot = fs4.existsSync(path4.join(deps.cwd, ".git")) || fs4.existsSync(path4.join(deps.cwd, ".claude")) || fs4.existsSync(file);
  let config = {};
  if (fs4.existsSync(file)) {
    try {
      const parsed = JSON.parse(fs4.readFileSync(file, "utf8"));
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not a JSON object");
      config = parsed;
    } catch (e) {
      deps.stderr(`${deps.prog}: ${file} is not valid JSON (${e.message}); left untouched
`);
      return 1;
    }
  }
  if (config.mcpServers !== void 0 && (config.mcpServers === null || typeof config.mcpServers !== "object" || Array.isArray(config.mcpServers))) {
    deps.stderr(`${deps.prog}: "mcpServers" in ${file} is not an object; left untouched
`);
    return 1;
  }
  const servers = config.mcpServers ?? {};
  const name = serverName(app2);
  const args = [deps.launcher, ...deps.entryArgs ?? [app2.id, "mcp"]];
  if (app2.mcp.confinement === false) args.push("--allow-unconfined");
  else args.push("--root", deps.cwd);
  if (deps.compact) args.push("--compact");
  servers[name] = { type: "stdio", command: deps.execPath, args };
  config.mcpServers = servers;
  const tmp = `${file}.${process.pid}.tmp`;
  fs4.writeFileSync(tmp, `${JSON.stringify(config, null, 2)}
`);
  fs4.renameSync(tmp, file);
  deps.stderr(`${deps.prog}: registered "${name}" in ${file}
`);
  deps.stderr("  note: the entry holds absolute paths and is machine-specific (do not commit it for a team).\n");
  deps.stderr("  note: Claude Code asks you to approve a project-scoped server from .mcp.json before it starts it.\n");
  if (app2.mcp.confinement === false) {
    deps.stderr(`  warning: ${app2.name}'s server is unconfined \u2014 it can read and write any path the user can (registered with --allow-unconfined).
`);
  }
  if (app2.mcp.toolClass === "large" && !deps.compact) {
    const hint = app2.mcp.compactFlag ? ` or register with --compact (helper tools only; every command stays reachable)` : "";
    deps.stderr(
      `  warning: ${app2.name}'s server exposes over ${Math.floor(app2.mcp.tools / 100) * 100} tools (${app2.mcp.tools}); that floods the model context \u2014 prefer the bash route (${deps.prog} ${app2.id} exec \u2026)${hint}.
`
    );
  }
  if (!looksLikeRoot) {
    deps.stderr(`  warning: ${deps.cwd} does not look like a project root (no .git, .claude/ or .mcp.json); Claude Code reads .mcp.json from the project root.
`);
  }
  return 0;
}

// src/app-command.ts
function execPassthrough(prog, bin, args) {
  return new Promise((resolve6) => {
    const child = spawn(bin, args, { stdio: "inherit" });
    const forward = (sig) => () => child.kill(sig);
    const handlers = ["SIGINT", "SIGTERM"].map((sig) => [sig, forward(sig)]);
    for (const [sig, h] of handlers) process.on(sig, h);
    const release = () => {
      for (const [sig, h] of handlers) process.off(sig, h);
    };
    child.on("error", (e) => {
      release();
      process.stderr.write(`${prog}: failed to run ${bin}: ${e.message}
`);
      resolve6(1);
    });
    child.on("exit", (code, signal) => (release(), resolve6(signal ? signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : 1 : code ?? 1)));
  });
}
async function runAppCommand(app2, command, rest, ctx) {
  switch (command) {
    case "ensure":
    case "path": {
      let report;
      try {
        report = await ctx.provision({ probeVersion: command === "ensure" });
      } catch (e) {
        ctx.stderr(`${ctx.prog}: ${e.message}
`);
        return 69;
      }
      ctx.stdout(command === "ensure" ? `${JSON.stringify(report)}
` : `${report.binary}
`);
      return 0;
    }
    case "exec": {
      let bin;
      try {
        bin = (await ctx.provision()).binary;
      } catch (e) {
        ctx.stderr(`${ctx.prog}: ${e.message}
`);
        return 69;
      }
      return execPassthrough(ctx.prog, bin, rest);
    }
    case "mcp": {
      if (rest.includes("--register")) {
        const other = rest.filter((a) => a !== "--register" && a !== "--allow-unconfined" && a !== "--compact");
        if (other.length > 0) {
          ctx.stderr(`--register takes no other option than --allow-unconfined and --compact
${ctx.usage}
`);
          return 1;
        }
        return registerMcp(app2, {
          stderr: ctx.stderr,
          prog: ctx.prog,
          allowUnconfined: rest.includes("--allow-unconfined"),
          compact: rest.includes("--compact"),
          ...ctx.register ? { launcher: ctx.register.launcher, entryArgs: ctx.register.entryArgs } : {}
        });
      }
      return runMcp(app2, rest, { prog: ctx.prog, provision: ctx.provision, stderr: ctx.stderr, ...ctx.version ? { serverVersion: ctx.version } : {} });
    }
    default:
      return void 0;
  }
}

// src/dictionary.ts
import * as fs5 from "node:fs";
import * as path5 from "node:path";
var HU_COMMIT = "74b6ae2a2df22fd9d6e253f0391ac3a67cb7b3f8";
var HU_FILES = [
  { name: "hu_HU.aff", sha256: "f3a2748dd535cfde2142ab17d0f7f8e4787b03fb25a60829c69ac8d493db4802", bytes: 2316267 },
  { name: "hu_HU.dic", sha256: "97293d670ad4a3b8e7eebef7e25c6e8e939b914c64b6b4672b2bf416b768f990", bytes: 1786144 },
  { name: "README_hu_HU.txt", sha256: "52b17fc3d53b6935eab747a71894507d702f7f0fde379c819c16cc803005fc84", bytes: 1190 }
];
function huUrl(name, base = "https://raw.githubusercontent.com") {
  return `${base}/LibreOffice/dictionaries/${HU_COMMIT}/hu_HU/${name}`;
}
function dictionaryDir(deps) {
  return path5.join(craftRoot(deps), "dictionaries");
}
function huInstalled(deps) {
  return hasHu(dictionaryDir(deps));
}
function huDesktopDir(desktopRoots) {
  return desktopRoots.map((r) => path5.join(r, "dictionaries")).find(hasHu);
}
function hasHu(dir) {
  return ["hu_HU.aff", "hu_HU.dic"].every((n) => {
    try {
      const st = fs5.statSync(path5.join(dir, n));
      return st.isFile() && st.size > 0;
    } catch {
      return false;
    }
  });
}
function wordcraftEnv(env, deps) {
  if (env.WORDCRAFT_DICTIONARIES || !huInstalled(deps)) return env;
  return { ...env, WORDCRAFT_DICTIONARIES: dictionaryDir(deps) };
}
async function ensureHu(deps, files = HU_FILES, base) {
  const finalDir = dictionaryDir(deps);
  if (huInstalled(deps)) return finalDir;
  const parent = path5.dirname(finalDir);
  return singleFlight(`install:${finalDir}`, async () => {
    if (huInstalled(deps)) return finalDir;
    fs5.mkdirSync(parent, { recursive: true });
    sweepStaleStaging(parent, deps.now());
    const staging = path5.join(parent, `.staging-${process.pid}-${deps.randomId()}`);
    try {
      const tree = path5.join(staging, "tree");
      fs5.mkdirSync(tree, { recursive: true });
      deps.log(`[aiplus-office] downloading the Hungarian dictionary (hu_HU, about 4 MB) from github.com/LibreOffice/dictionaries`);
      for (const f of files) {
        const actual = await downloadFile(deps, huUrl(f.name, base), path5.join(tree, f.name), f.bytes);
        if (actual !== f.sha256) throw new ProvisionError(`checksum mismatch for ${f.name}: expected ${f.sha256}, got ${actual}`);
      }
      fs5.rmSync(finalDir, { recursive: true, force: true });
      fs5.renameSync(tree, finalDir);
      return finalDir;
    } finally {
      fs5.rmSync(staging, { recursive: true, force: true });
    }
  });
}

// src/doc-prepare.ts
import { randomBytes } from "node:crypto";
import * as fs6 from "node:fs";
import * as os3 from "node:os";
import * as path6 from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";

// node_modules/fflate/esm/index.mjs
import { createRequire } from "module";
var require2 = createRequire("/");
var _a;
var Worker;
var isMarkedAsUntransferable;
try {
  _a = require2("worker_threads"), Worker = _a.Worker, isMarkedAsUntransferable = _a.isMarkedAsUntransferable;
} catch (e) {
}
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b = new u16(31);
  for (var i = 0; i < 31; ++i) {
    b[i] = start += 1 << eb[i - 1];
  }
  var r = new i32(b[30]);
  for (var i = 1; i < 30; ++i) {
    for (var j = b[i]; j < b[i + 1]; ++j) {
      r[j] = j - b[i] << 5 | i;
    }
  }
  return { b, r };
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = (function(cd, mb, r) {
  var s = cd.length;
  var i = 0;
  var l = new u16(mb);
  for (; i < s; ++i) {
    if (cd[i])
      ++l[cd[i] - 1];
  }
  var le = new u16(mb);
  for (i = 1; i < mb; ++i) {
    le[i] = le[i - 1] + l[i - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        var sv = i << 4 | cd[i];
        var r_1 = mb - cd[i];
        var v = le[cd[i] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
      }
    }
  }
  return co;
});
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flm = /* @__PURE__ */ hMap(flt, 9, 0);
var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
var fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
var max = function(a) {
  var m = a[0];
  for (var i = 1; i < a.length; ++i) {
    if (a[i] > m)
      m = a[i];
  }
  return m;
};
var bits = function(d, p, m) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
};
var bits16 = function(d, p) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
};
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new u8(v.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  // determined by compression function
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var inflt = function(dat, st, buf, dict) {
  var sl = dat.length, dl = dict ? dict.length : 0;
  if (!sl || st.f && !st.l)
    return buf || new u8(0);
  var noBuf = !buf;
  var resize = noBuf || st.i != 2;
  var noSt = st.i;
  if (noBuf)
    buf = new u8(sl * 3);
  var cbuf = function(l2) {
    var bl = buf.length;
    if (l2 > bl) {
      var nbuf = new u8(Math.max(bl * 2, l2));
      nbuf.set(buf);
      buf = nbuf;
    }
  };
  var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
  var tbts = sl * 8;
  do {
    if (!lm) {
      final = bits(dat, pos, 1);
      var type = bits(dat, pos + 1, 3);
      pos += 3;
      if (!type) {
        var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
        if (t > sl) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + l);
        buf.set(dat.subarray(s, t), bt);
        st.b = bt += l, st.p = pos = t * 8, st.f = final;
        continue;
      } else if (type == 1)
        lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
      else if (type == 2) {
        var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
        var tl = hLit + bits(dat, pos + 5, 31) + 1;
        pos += 14;
        var ldt = new u8(tl);
        var clt = new u8(19);
        for (var i = 0; i < hcLen; ++i) {
          clt[clim[i]] = bits(dat, pos + i * 3, 7);
        }
        pos += hcLen * 3;
        var clb = max(clt), clbmsk = (1 << clb) - 1;
        var clm = hMap(clt, clb, 1);
        for (var i = 0; i < tl; ) {
          var r = clm[bits(dat, pos, clbmsk)];
          pos += r & 15;
          var s = r >> 4;
          if (s < 16) {
            ldt[i++] = s;
          } else {
            var c = 0, n = 0;
            if (s == 16)
              n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
            else if (s == 17)
              n = 3 + bits(dat, pos, 7), pos += 3;
            else if (s == 18)
              n = 11 + bits(dat, pos, 127), pos += 7;
            while (n--)
              ldt[i++] = c;
          }
        }
        var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
        lbt = max(lt);
        dbt = max(dt);
        lm = hMap(lt, lbt, 1);
        dm = hMap(dt, dbt, 1);
      } else
        err(1);
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
    }
    if (resize)
      cbuf(bt + 131072);
    var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
    var lpos = pos;
    for (; ; lpos = pos) {
      var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
      pos += c & 15;
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
      if (!c)
        err(2);
      if (sym < 256)
        buf[bt++] = sym;
      else if (sym == 256) {
        lpos = pos, lm = null;
        break;
      } else {
        var add = sym - 254;
        if (sym > 264) {
          var i = sym - 257, b = fleb[i];
          add = bits(dat, pos, (1 << b) - 1) + fl[i];
          pos += b;
        }
        var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
        if (!d)
          err(3);
        pos += d & 15;
        var dt = fd[dsym];
        if (dsym > 3) {
          var b = fdeb[dsym];
          dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
        }
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + 131072);
        var end = bt + add;
        if (bt < dt) {
          var shift = dl - dt, dend = Math.min(dt, end);
          if (shift + bt < 0)
            err(3);
          for (; bt < dend; ++bt)
            buf[bt] = dict[shift + bt];
        }
        for (; bt < end; ++bt)
          buf[bt] = buf[bt - dt];
      }
    }
    st.l = lm, st.p = lpos, st.b = bt, st.f = final;
    if (lm)
      final = 1, st.m = lbt, st.d = dm, st.n = dbt;
  } while (!final);
  return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
var wbits = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
};
var wbits16 = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
  d[o + 2] |= v >> 16;
};
var hTree = function(d, mb) {
  var t = [];
  for (var i = 0; i < d.length; ++i) {
    if (d[i])
      t.push({ s: i, f: d[i] });
  }
  var s = t.length;
  var t2 = t.slice();
  if (!s)
    return { t: et, l: 0 };
  if (s == 1) {
    var v = new u8(t[0].s + 1);
    v[t[0].s] = 1;
    return { t: v, l: 1 };
  }
  t.sort(function(a, b) {
    return a.f - b.f;
  });
  t.push({ s: -1, f: 25001 });
  var l = t[0], r = t[1], i0 = 0, i1 = 1, i2 = 2;
  t[0] = { s: -1, f: l.f + r.f, l, r };
  while (i1 != s - 1) {
    l = t[t[i0].f < t[i2].f ? i0++ : i2++];
    r = t[i0 != i1 && t[i0].f < t[i2].f ? i0++ : i2++];
    t[i1++] = { s: -1, f: l.f + r.f, l, r };
  }
  var maxSym = t2[0].s;
  for (var i = 1; i < s; ++i) {
    if (t2[i].s > maxSym)
      maxSym = t2[i].s;
  }
  var tr = new u16(maxSym + 1);
  var mbt = ln(t[i1 - 1], tr, 0);
  if (mbt > mb) {
    var i = 0, dt = 0;
    var lft = mbt - mb, cst = 1 << lft;
    t2.sort(function(a, b) {
      return tr[b.s] - tr[a.s] || a.f - b.f;
    });
    for (; i < s; ++i) {
      var i2_1 = t2[i].s;
      if (tr[i2_1] > mb) {
        dt += cst - (1 << mbt - tr[i2_1]);
        tr[i2_1] = mb;
      } else
        break;
    }
    dt >>= lft;
    while (dt > 0) {
      var i2_2 = t2[i].s;
      if (tr[i2_2] < mb)
        dt -= 1 << mb - tr[i2_2]++ - 1;
      else
        ++i;
    }
    for (; i >= 0 && dt; --i) {
      var i2_3 = t2[i].s;
      if (tr[i2_3] == mb) {
        --tr[i2_3];
        ++dt;
      }
    }
    mbt = mb;
  }
  return { t: new u8(tr), l: mbt };
};
var ln = function(n, l, d) {
  return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
};
var lc = function(c) {
  var s = c.length;
  while (s && !c[--s])
    ;
  var cl = new u16(++s);
  var cli = 0, cln = c[0], cls = 1;
  var w = function(v) {
    cl[cli++] = v;
  };
  for (var i = 1; i <= s; ++i) {
    if (c[i] == cln && i != s)
      ++cls;
    else {
      if (!cln && cls > 2) {
        for (; cls > 138; cls -= 138)
          w(32754);
        if (cls > 2) {
          w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
          cls = 0;
        }
      } else if (cls > 3) {
        w(cln), --cls;
        for (; cls > 6; cls -= 6)
          w(8304);
        if (cls > 2)
          w(cls - 3 << 5 | 8208), cls = 0;
      }
      while (cls--)
        w(cln);
      cls = 1;
      cln = c[i];
    }
  }
  return { c: cl.subarray(0, cli), n: s };
};
var clen = function(cf, cl) {
  var l = 0;
  for (var i = 0; i < cl.length; ++i)
    l += cf[i] * cl[i];
  return l;
};
var wfblk = function(out, pos, dat) {
  var s = dat.length;
  var o = shft(pos + 2);
  out[o] = s & 255;
  out[o + 1] = s >> 8;
  out[o + 2] = out[o] ^ 255;
  out[o + 3] = out[o + 1] ^ 255;
  for (var i = 0; i < s; ++i)
    out[o + i + 4] = dat[i];
  return (o + 4 + s) * 8;
};
var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
  wbits(out, p++, final);
  ++lf[256];
  var _a2 = hTree(lf, 15), dlt = _a2.t, mlb = _a2.l;
  var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
  var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
  var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
  var lcfreq = new u16(19);
  for (var i = 0; i < lclt.length; ++i)
    ++lcfreq[lclt[i] & 31];
  for (var i = 0; i < lcdt.length; ++i)
    ++lcfreq[lcdt[i] & 31];
  var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
  var nlcc = 19;
  for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
    ;
  var flen = bl + 5 << 3;
  var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
  var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
  if (bs >= 0 && flen <= ftlen && flen <= dtlen)
    return wfblk(out, p, dat.subarray(bs, bs + bl));
  var lm, ll, dm, dl;
  wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
  if (dtlen < ftlen) {
    lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
    var llm = hMap(lct, mlcb, 0);
    wbits(out, p, nlc - 257);
    wbits(out, p + 5, ndc - 1);
    wbits(out, p + 10, nlcc - 4);
    p += 14;
    for (var i = 0; i < nlcc; ++i)
      wbits(out, p + 3 * i, lct[clim[i]]);
    p += 3 * nlcc;
    var lcts = [lclt, lcdt];
    for (var it = 0; it < 2; ++it) {
      var clct = lcts[it];
      for (var i = 0; i < clct.length; ++i) {
        var len = clct[i] & 31;
        wbits(out, p, llm[len]), p += lct[len];
        if (len > 15)
          wbits(out, p, clct[i] >> 5 & 127), p += clct[i] >> 12;
      }
    }
  } else {
    lm = flm, ll = flt, dm = fdm, dl = fdt;
  }
  for (var i = 0; i < li; ++i) {
    var sym = syms[i];
    if (sym > 255) {
      var len = sym >> 18 & 31;
      wbits16(out, p, lm[len + 257]), p += ll[len + 257];
      if (len > 7)
        wbits(out, p, sym >> 23 & 31), p += fleb[len];
      var dst = sym & 31;
      wbits16(out, p, dm[dst]), p += dl[dst];
      if (dst > 3)
        wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
    } else {
      wbits16(out, p, lm[sym]), p += ll[sym];
    }
  }
  wbits16(out, p, lm[256]);
  return p + ll[256];
};
var deo = /* @__PURE__ */ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
var et = /* @__PURE__ */ new u8(0);
var dflt = function(dat, lvl, plvl, pre, post, st) {
  var s = st.z || dat.length;
  var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
  var w = o.subarray(pre, o.length - post);
  var lst = st.l;
  var pos = (st.r || 0) & 7;
  if (lvl) {
    if (pos)
      w[0] = st.r >> 3;
    var opt = deo[lvl - 1];
    var n = opt >> 13, c = opt & 8191;
    var msk_1 = (1 << plvl) - 1;
    var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
    var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
    var hsh = function(i2) {
      return (dat[i2] ^ dat[i2 + 1] << bs1_1 ^ dat[i2 + 2] << bs2_1) & msk_1;
    };
    var syms = new i32(25e3);
    var lf = new u16(288), df = new u16(32);
    var lc_1 = 0, eb = 0, i = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
    for (; i + 2 < s; ++i) {
      var hv = hsh(i);
      var imod = i & 32767, pimod = head[hv];
      prev[imod] = pimod;
      head[hv] = imod;
      if (wi <= i) {
        var rem = s - i;
        if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
          pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i - bs, pos);
          li = lc_1 = eb = 0, bs = i;
          for (var j = 0; j < 286; ++j)
            lf[j] = 0;
          for (var j = 0; j < 30; ++j)
            df[j] = 0;
        }
        var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
        if (rem > 2 && hv == hsh(i - dif)) {
          var maxn = Math.min(n, rem) - 1;
          var maxd = Math.min(32767, i);
          var ml = Math.min(258, rem);
          while (dif <= maxd && --ch_1 && imod != pimod) {
            if (dat[i + l] == dat[i + l - dif]) {
              var nl = 0;
              for (; nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl)
                ;
              if (nl > l) {
                l = nl, d = dif;
                if (nl > maxn)
                  break;
                var mmd = Math.min(dif, nl - 2);
                var md = 0;
                for (var j = 0; j < mmd; ++j) {
                  var ti = i - dif + j & 32767;
                  var pti = prev[ti];
                  var cd = ti - pti & 32767;
                  if (cd > md)
                    md = cd, pimod = ti;
                }
              }
            }
            imod = pimod, pimod = prev[imod];
            dif += imod - pimod & 32767;
          }
        }
        if (d) {
          syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
          var lin = revfl[l] & 31, din = revfd[d] & 31;
          eb += fleb[lin] + fdeb[din];
          ++lf[257 + lin];
          ++df[din];
          wi = i + l;
          ++lc_1;
        } else {
          syms[li++] = dat[i];
          ++lf[dat[i]];
        }
      }
    }
    for (i = Math.max(i, wi); i < s; ++i) {
      syms[li++] = dat[i];
      ++lf[dat[i]];
    }
    pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i - bs, pos);
    if (!lst) {
      st.r = pos & 7 | w[pos / 8 | 0] << 3;
      pos -= 7;
      st.h = head, st.p = prev, st.i = i, st.w = wi;
    }
  } else {
    for (var i = st.w || 0; i < s + lst; i += 65535) {
      var e = i + 65535;
      if (e >= s) {
        w[pos / 8 | 0] = lst;
        e = s;
      }
      pos = wfblk(w, pos + 1, dat.subarray(i, e));
    }
    st.i = s;
  }
  return slc(o, 0, pre + shft(pos) + post);
};
var crct = /* @__PURE__ */ (function() {
  var t = new Int32Array(256);
  for (var i = 0; i < 256; ++i) {
    var c = i, k = 9;
    while (--k)
      c = (c & 1 && -306674912) ^ c >>> 1;
    t[i] = c;
  }
  return t;
})();
var crc = function() {
  var c = -1;
  return {
    p: function(d) {
      var cr = c;
      for (var i = 0; i < d.length; ++i)
        cr = crct[cr & 255 ^ d[i]] ^ cr >>> 8;
      c = cr;
    },
    d: function() {
      return ~c;
    }
  };
};
var dopt = function(dat, opt, pre, post, st) {
  if (!st) {
    st = { l: 1 };
    if (opt.dictionary) {
      var dict = opt.dictionary.subarray(-32768);
      var newDat = new u8(dict.length + dat.length);
      newDat.set(dict);
      newDat.set(dat, dict.length);
      dat = newDat;
      st.w = dict.length;
    }
  }
  return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
};
var mrg = function(a, b) {
  var o = {};
  for (var k in a)
    o[k] = a[k];
  for (var k in b)
    o[k] = b[k];
  return o;
};
var b2 = function(d, b) {
  return d[b] | d[b + 1] << 8;
};
var b4 = function(d, b) {
  return (d[b] | d[b + 1] << 8 | d[b + 2] << 16 | d[b + 3] << 24) >>> 0;
};
var b8 = function(d, b) {
  return b4(d, b) + b4(d, b + 4) * 4294967296;
};
var wbytes = function(d, b, v) {
  for (; v; ++b)
    d[b] = v, v >>>= 8;
};
function deflateSync(data, opts) {
  return dopt(data, opts || {}, 0, 0);
}
function inflateSync(data, opts) {
  return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
var fltn = function(d, p, t, o) {
  for (var k in d) {
    var val = d[k], n = p + k, op = o;
    if (Array.isArray(val))
      op = mrg(o, val[1]), val = val[0];
    if (ArrayBuffer.isView(val))
      t[n] = [val, op];
    else {
      t[n += "/"] = [new u8(0), op];
      fltn(val, n, t, o);
    }
  }
};
var te = typeof TextEncoder != "undefined" && /* @__PURE__ */ new TextEncoder();
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}
var dutf8 = function(d) {
  for (var r = "", i = 0; ; ) {
    var c = d[i++];
    var eb = (c > 127) + (c > 223) + (c > 239);
    if (i + eb > d.length)
      return { s: r, r: slc(d, i - 1) };
    if (!eb)
      r += String.fromCharCode(c);
    else if (eb == 3) {
      c = ((c & 15) << 18 | (d[i++] & 63) << 12 | (d[i++] & 63) << 6 | d[i++] & 63) - 65536, r += String.fromCharCode(55296 | c >> 10, 56320 | c & 1023);
    } else if (eb & 1)
      r += String.fromCharCode((c & 31) << 6 | d[i++] & 63);
    else
      r += String.fromCharCode((c & 15) << 12 | (d[i++] & 63) << 6 | d[i++] & 63);
  }
};
function strToU8(str, latin1) {
  if (latin1) {
    var ar_1 = new u8(str.length);
    for (var i = 0; i < str.length; ++i)
      ar_1[i] = str.charCodeAt(i);
    return ar_1;
  }
  if (te)
    return te.encode(str);
  var l = str.length;
  var ar = new u8(str.length + (str.length >> 1));
  var ai = 0;
  var w = function(v) {
    ar[ai++] = v;
  };
  for (var i = 0; i < l; ++i) {
    if (ai + 5 > ar.length) {
      var n = new u8(ai + 8 + (l - i << 1));
      n.set(ar);
      ar = n;
    }
    var c = str.charCodeAt(i);
    if (c < 128 || latin1)
      w(c);
    else if (c < 2048)
      w(192 | c >> 6), w(128 | c & 63);
    else if (c > 55295 && c < 57344)
      c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i) & 1023, w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63);
    else
      w(224 | c >> 12), w(128 | c >> 6 & 63), w(128 | c & 63);
  }
  return slc(ar, 0, ai);
}
function strFromU8(dat, latin1) {
  if (latin1) {
    var r = "";
    for (var i = 0; i < dat.length; i += 16384)
      r += String.fromCharCode.apply(null, dat.subarray(i, i + 16384));
    return r;
  } else if (td) {
    return td.decode(dat);
  } else {
    var _a2 = dutf8(dat), s = _a2.s, r = _a2.r;
    if (r.length)
      err(8);
    return s;
  }
}
var slzh = function(d, b) {
  return b + 30 + b2(d, b + 26) + b2(d, b + 28);
};
var zh = function(d, b, z) {
  var fnl = b2(d, b + 28), efl = b2(d, b + 30), fn = strFromU8(d.subarray(b + 46, b + 46 + fnl), !(b2(d, b + 8) & 2048)), es = b + 46 + fnl;
  var _a2 = z64hs(d, es, efl, z, b4(d, b + 20), b4(d, b + 24), b4(d, b + 42)), sc = _a2[0], su = _a2[1], off = _a2[2];
  return [b2(d, b + 10), sc, su, fn, es + efl + b2(d, b + 32), off];
};
var z64hs = function(d, b, l, z, sc, su, off) {
  var nsc = sc == 4294967295, nsu = su == 4294967295, noff = off == 4294967295, e = b + l;
  var nf = nsc + nsu + noff;
  if (z && nf) {
    for (; b + 4 < e; b += 4 + b2(d, b + 2)) {
      if (b2(d, b) == 1) {
        return [
          nsc ? b8(d, b + 4 + 8 * nsu) : sc,
          nsu ? b8(d, b + 4) : su,
          noff ? b8(d, b + 4 + 8 * (nsu + nsc)) : off,
          1
        ];
      }
    }
    if (z < 2)
      err(13);
  }
  return [sc, su, off, 0];
};
var exfl = function(ex) {
  var le = 0;
  if (ex) {
    for (var k in ex) {
      var l = ex[k].length;
      if (l > 65535)
        err(9);
      le += l + 4;
    }
  }
  return le;
};
var wzh = function(d, b, f, fn, u, c, ce, co) {
  var fl2 = fn.length, ex = f.extra, col = co && co.length;
  var exl = exfl(ex);
  wbytes(d, b, ce != null ? 33639248 : 67324752), b += 4;
  if (ce != null)
    d[b++] = 20, d[b++] = f.os;
  d[b] = 20, b += 2;
  d[b++] = f.flag << 1 | (c < 0 && 8), d[b++] = u && 8;
  d[b++] = f.compression & 255, d[b++] = f.compression >> 8;
  var dt = new Date(f.mtime == null ? Date.now() : f.mtime), y = dt.getFullYear() - 1980;
  if (y < 0 || y > 119)
    err(10);
  wbytes(d, b, y << 25 | dt.getMonth() + 1 << 21 | dt.getDate() << 16 | dt.getHours() << 11 | dt.getMinutes() << 5 | dt.getSeconds() >> 1), b += 4;
  if (c != -1) {
    wbytes(d, b, f.crc);
    wbytes(d, b + 4, c < 0 ? -c - 2 : c);
    wbytes(d, b + 8, f.size);
  }
  wbytes(d, b + 12, fl2);
  wbytes(d, b + 14, exl), b += 16;
  if (ce != null) {
    wbytes(d, b, col);
    wbytes(d, b + 6, f.attrs);
    wbytes(d, b + 10, ce), b += 14;
  }
  d.set(fn, b);
  b += fl2;
  if (exl) {
    for (var k in ex) {
      var exf = ex[k], l = exf.length;
      wbytes(d, b, +k);
      wbytes(d, b + 2, l);
      d.set(exf, b + 4), b += 4 + l;
    }
  }
  if (col)
    d.set(co, b), b += col;
  return b;
};
var wzf = function(o, b, c, d, e) {
  wbytes(o, b, 101010256);
  wbytes(o, b + 8, c);
  wbytes(o, b + 10, c);
  wbytes(o, b + 12, d);
  wbytes(o, b + 16, e);
};
function zipSync(data, opts) {
  if (!opts)
    opts = {};
  var r = {};
  var files = [];
  fltn(data, "", r, opts);
  var o = 0;
  var tot = 0;
  for (var fn in r) {
    var _a2 = r[fn], file = _a2[0], p = _a2[1];
    var compression = p.level == 0 ? 0 : 8;
    var f = strToU8(fn), s = f.length;
    var com = p.comment, m = com && strToU8(com), ms = m && m.length;
    var exl = exfl(p.extra);
    if (s > 65535)
      err(11);
    var d = compression ? deflateSync(file, p) : file, l = d.length;
    var c = crc();
    c.p(file);
    files.push(mrg(p, {
      size: file.length,
      crc: c.d(),
      c: d,
      f,
      m,
      u: s != fn.length || m && com.length != ms,
      o,
      compression
    }));
    o += 30 + s + exl + l;
    tot += 76 + 2 * (s + exl) + (ms || 0) + l;
  }
  var out = new u8(tot + 22), oe = o, cdl = tot - o;
  for (var i = 0; i < files.length; ++i) {
    var f = files[i];
    wzh(out, f.o, f, f.f, f.u, f.c.length);
    var badd = 30 + f.f.length + exfl(f.extra);
    out.set(f.c, f.o + badd);
    wzh(out, o, f, f.f, f.u, f.c.length, f.o, f.m), o += 16 + badd + (f.m ? f.m.length : 0);
  }
  wzf(out, o, files.length, cdl, oe);
  return out;
}
function unzipSync(data, opts) {
  var files = {};
  var e = data.length - 22;
  for (; b4(data, e) != 101010256; --e) {
    if (!e || data.length - e > 65558)
      err(13);
  }
  ;
  var c = b2(data, e + 8);
  if (!c)
    return {};
  var o = b4(data, e + 16);
  var z = b4(data, e - 20) == 117853008;
  if (z) {
    var ze = b4(data, e - 12);
    z = b4(data, ze) == 101075792;
    if (z) {
      c = b4(data, ze + 32);
      o = b4(data, ze + 48);
    }
  }
  var fltr = opts && opts.filter;
  for (var i = 0; i < c; ++i) {
    var _a2 = zh(data, o, z), c_2 = _a2[0], sc = _a2[1], su = _a2[2], fn = _a2[3], no = _a2[4], off = _a2[5], b = slzh(data, off);
    o = no;
    if (!fltr || fltr({
      name: fn,
      size: sc,
      originalSize: su,
      compression: c_2
    })) {
      if (!c_2)
        files[fn] = slc(data, b, b + sc);
      else if (c_2 == 8)
        files[fn] = inflateSync(data.subarray(b, b + sc), { out: new u8(su) });
      else
        err(14, "unknown compression type " + c_2);
    }
  }
  return files;
}

// src/doc-prepare.ts
var import_yaml = __toESM(require_dist(), 1);
var DOC_USAGE = `usage: aiplus-office doc prepare <in.md> --out <dir> [--template <name>] [--templates-dir <dir>] [--var k=v]\u2026
                           [--allow-path <dir>]\u2026 [--allow-missing] [--json]

Fills the docx template's placeholders (frontmatter, --var, template defaults, system variables), inlines images
and renders Mermaid blocks. Writes <dir>/template.filled.docx, <dir>/body.md and <dir>/prepare.json.

exit: 0 ok \xB7 1 failed / unresolved placeholders without --allow-missing \xB7 2 usage`;
var PrepareError = class extends Error {
  code;
  constructor(message, code) {
    super(message);
    this.code = code;
  }
};
function findOnPath(name, pathVar, platform = process.platform, pathExt = ".EXE;.CMD;.BAT") {
  const exts = platform === "win32" ? ["", ...pathExt.split(";").filter(Boolean)] : [""];
  for (const dir of (pathVar ?? "").split(platform === "win32" ? ";" : ":").filter(Boolean)) {
    for (const ext of exts) {
      const f = path6.join(dir, name + ext);
      try {
        if (fs6.statSync(f).isFile()) return f;
      } catch {
      }
    }
  }
  return void 0;
}
function defaultPrepareDeps(env = process.env) {
  const which = (name) => findOnPath(name, env.PATH ?? env.Path, process.platform, env.PATHEXT);
  return {
    stdout: (t) => process.stdout.write(t),
    stderr: (t) => process.stderr.write(t),
    env,
    cwd: process.cwd(),
    homedir: os3.homedir(),
    now: () => /* @__PURE__ */ new Date(),
    which,
    run: async (file, args, opts) => {
      try {
        await execFileAsync(file, args, { timeout: opts?.timeout ?? 12e4, maxBuffer: 16 * 1024 * 1024, env });
      } catch (e) {
        const err2 = e;
        const first = (err2.stderr?.toString() ?? "").split("\n").find((l) => l.trim());
        throw new Error(first?.trim() || err2.message.split("\n")[0]);
      }
    }
  };
}
var VALUE_OPTIONS = {
  "--out": (p, v) => {
    p.out = v;
  },
  "--template": (p, v) => {
    p.template = v;
  },
  "--templates-dir": (p, v) => {
    p.templatesDir = v;
  },
  "--allow-path": (p, v) => {
    p.allowPaths.push(v);
  },
  "--var": (p, kv) => {
    const eq = kv.indexOf("=");
    if (eq <= 0) throw new PrepareError(`--var expects name=value, got "${kv}"`, 2);
    const name = kv.slice(0, eq);
    if (!VAR_NAME.test(name)) throw new PrepareError(`--var: invalid variable name "${name}"`, 2);
    p.vars.set(name, kv.slice(eq + 1));
  }
};
var FLAG_OPTIONS = {
  "--allow-missing": (p) => {
    p.allowMissing = true;
  },
  "--json": (p) => {
    p.json = true;
  }
};
function setInput(p, a) {
  if (a.startsWith("-")) throw new PrepareError(`unknown option ${a}`, 2);
  if (p.input) throw new PrepareError(`unexpected argument ${a}`, 2);
  p.input = a;
}
function parsePrepareArgs(argv) {
  const p = { input: "", out: "", vars: /* @__PURE__ */ new Map(), allowPaths: [], allowMissing: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") return { help: true };
    if (a in VALUE_OPTIONS) {
      const v = argv[++i];
      if (v === void 0) throw new PrepareError(`${a} needs a value`, 2);
      VALUE_OPTIONS[a](p, v);
    } else if (a in FLAG_OPTIONS) FLAG_OPTIONS[a](p);
    else setInput(p, a);
  }
  if (!p.input) throw new PrepareError("missing <in.md>", 2);
  if (!p.out) throw new PrepareError("missing --out <dir>", 2);
  return p;
}
var VAR_NAME = /^[A-Za-z_$][A-Za-z0-9_.:-]*$/;
var TEMPLATE_NAME = /^[A-Za-z0-9_-]+$/;
var HANDLED_KEYS = /* @__PURE__ */ new Set(["template", "templates_dir", "language", "document_title", "document_name", "enable_toc", "toc_heading", "variables"]);
var ENGINE_ONLY_KEYS = /* @__PURE__ */ new Set([
  "enable_cover_page",
  "toc_style",
  "diagram_format",
  "diagram_width",
  "diagram_scale",
  "embed_svg_in_word",
  "diagrams",
  "code_style",
  "tree_style",
  "font_name",
  "embed_fonts",
  "table_style",
  "table_profiles",
  "image_style",
  "logos",
  "debug",
  // upstream's AI diagram route; not part of this port
  "nano_banana"
]);
function splitFrontmatter(text) {
  const m = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text);
  if (!m) return { data: {}, body: text };
  let data;
  try {
    data = (0, import_yaml.parse)(m[1]);
  } catch (e) {
    throw new PrepareError(`frontmatter is not valid YAML: ${e.message.split("\n")[0]}`, 1);
  }
  if (data !== null && data !== void 0 && (typeof data !== "object" || Array.isArray(data))) throw new PrepareError("frontmatter must be a YAML mapping", 1);
  return { data: data ?? {}, body: text.slice(m[0].length) };
}
var isScalar = (v) => ["string", "number", "boolean"].includes(typeof v);
function realOrResolve(p) {
  try {
    return fs6.realpathSync(p);
  } catch {
    return path6.resolve(p);
  }
}
var within = (child, parent) => {
  const rel = path6.relative(parent, child);
  return rel === "" || !rel.startsWith("..") && !path6.isAbsolute(rel);
};
function confinement(mdDir, allow, cwd) {
  const roots = [realOrResolve(mdDir), ...allow.map((a) => realOrResolve(path6.resolve(cwd, a)))];
  return { roots, allows: (p) => roots.some((r) => within(realOrResolve(p), r)) };
}
function resolveTemplatesDir(p, fm, mdDir, conf, deps) {
  if (p.templatesDir) return path6.resolve(deps.cwd, p.templatesDir);
  if (typeof fm.templates_dir === "string" && fm.templates_dir) {
    const dir = path6.resolve(mdDir, fm.templates_dir);
    if (!conf.allows(dir)) throw new PrepareError(`frontmatter templates_dir "${fm.templates_dir}" resolves outside the input's directory (${dir}); pass --allow-path or --templates-dir`, 1);
    return dir;
  }
  if (deps.env.AIPLUS_OFFICE_TEMPLATES_DIR) return path6.resolve(deps.cwd, deps.env.AIPLUS_OFFICE_TEMPLATES_DIR);
  for (const d of [path6.join(deps.cwd, "templates"), path6.join(deps.homedir, "Documents", "templates")]) if (isDir(d)) return d;
  throw new PrepareError("no templates directory found (--templates-dir, frontmatter templates_dir, $AIPLUS_OFFICE_TEMPLATES_DIR, ./templates, ~/Documents/templates)", 1);
}
var isDir = (d) => {
  try {
    return fs6.statSync(d).isDirectory();
  } catch {
    return false;
  }
};
var unescapeXml = (s) => s.replace(/&(?:#x([0-9a-fA-F]+)|#(\d+)|(lt|gt|amp|quot|apos));/g, (_m, hex, dec, name) => {
  if (name) return { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" }[name];
  const cp = hex ? Number.parseInt(hex, 16) : Number.parseInt(dec, 10);
  return cp >= 0 && cp <= 1114111 ? String.fromCodePoint(cp) : "";
});
var escapeXml = (s) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ud800-\udfff\ufffe\uffff]/gu, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function stripComments(xml) {
  let out = xml;
  for (let prev = ""; prev !== out; ) {
    prev = out;
    out = out.replace(/<!--[\s\S]*?-->/g, "");
  }
  return out;
}
function readTemplateMeta(dir) {
  const read = (f) => {
    try {
      return stripComments(fs6.readFileSync(path6.join(dir, f), "utf8"));
    } catch {
      return "";
    }
  };
  const defaults = /* @__PURE__ */ new Map();
  for (const m of read("variables.xml").matchAll(/<variable\b[^>]*?\bname="([^"]+)"[^>]*>([\s\S]*?)<\/variable>/g)) {
    const d = /<default>([\s\S]*?)<\/default>/.exec(m[2]);
    if (d && !m[1].startsWith("logo:")) defaults.set(unescapeXml(m[1]), unescapeXml(d[1]));
  }
  const syntax = /* @__PURE__ */ new Map();
  for (const m of read("manifest.xml").matchAll(/<variable\b([^>]*?)\/?>/g)) {
    const name = /\bname="([^"]+)"/.exec(m[1])?.[1];
    const syn = /\bsyntax="([^"]+)"/.exec(m[1])?.[1];
    if (name && syn) syntax.set(unescapeXml(name), (syntax.get(unescapeXml(name)) ?? /* @__PURE__ */ new Set()).add(syn));
  }
  return { defaults, syntax };
}
function angleNames(meta) {
  const out = /* @__PURE__ */ new Set();
  for (const [name, syns] of meta.syntax) if (syns.has("both")) out.add(name);
  for (const name of meta.defaults.keys()) if (!meta.syntax.has(name)) out.add(name);
  return out;
}
var MONTHS = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  hu: ["janu\xE1r", "febru\xE1r", "m\xE1rcius", "\xE1prilis", "m\xE1jus", "j\xFAnius", "j\xFAlius", "augusztus", "szeptember", "okt\xF3ber", "november", "december"],
  de: ["Januar", "Februar", "Marz", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  fr: ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"]
};
function formatDate(d, language) {
  const lang = language in MONTHS ? language : "en";
  const month = MONTHS[lang][d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  if (lang === "hu") return `${year}. ${month} ${day}.`;
  if (lang === "de") return `${day}. ${month} ${year}`;
  if (lang === "fr") return `${day} ${month} ${year}`;
  return `${month} ${day}, ${year}`;
}
var MUSTACHE = /\{\{\s*([A-Za-z_$][A-Za-z0-9_.:-]*)\s*\}\}/g;
var PART = /^word\/(?:document|header[^/]*|footer[^/]*)\.xml$/;
var MAX_DOCX_BYTES = 512 * 1024 * 1024;
function findPlaceholders(s, angle) {
  const found = [];
  for (const m of s.matchAll(MUSTACHE)) found.push({ start: m.index ?? 0, end: (m.index ?? 0) + m[0].length, name: m[1] });
  if (angle.size) {
    for (const m of s.matchAll(/<([A-Za-z_$][A-Za-z0-9_.:-]*)>/g)) if (angle.has(m[1])) found.push({ start: m.index ?? 0, end: (m.index ?? 0) + m[0].length, name: m[1] });
  }
  return found.sort((a, b) => a.start - b.start);
}
function scanParagraph(whole, ctx) {
  const edits = [];
  let rest = "";
  let from = 0;
  for (const ph of findPlaceholders(whole, ctx.angle)) {
    rest += `${whole.slice(from, ph.start)}\0`;
    from = ph.end;
    const v = ctx.values.get(ph.name);
    if (ph.name.startsWith("logo:") || ph.name === "$toc") ctx.ignored.add(ph.name);
    else if (v === void 0) ctx.unresolved.add(ph.name);
    else edits.push({ start: ph.start, end: ph.end, text: v });
  }
  rest += whole.slice(from);
  for (const fragment of [/\{\{[^}\u0000]*$/.exec(rest)?.[0], /^[^{\u0000]*\}\}/.exec(rest)?.[0]]) if (fragment) ctx.unresolved.add(fragment.trim());
  return edits;
}
function applyEdits(nodes, edits) {
  const starts = nodes.map((_, i) => nodes.slice(0, i).reduce((n, t) => n + t.length, 0));
  const texts2 = [...nodes];
  const touched = /* @__PURE__ */ new Set();
  for (const ed of [...edits].sort((a, b) => b.start - a.start)) {
    let first = true;
    for (let i = 0; i < texts2.length; i++) {
      const lo = Math.max(ed.start, starts[i]);
      const hi = Math.min(ed.end, starts[i] + nodes[i].length);
      if (hi <= lo) continue;
      texts2[i] = texts2[i].slice(0, lo - starts[i]) + (first ? ed.text : "") + texts2[i].slice(hi - starts[i]);
      touched.add(i);
      first = false;
    }
  }
  return texts2.map((t, i) => touched.has(i) ? t : null);
}
function fillParagraph(nodes, ctx) {
  const whole = nodes.join("");
  if (!whole.includes("{{") && !whole.includes("}}") && !whole.includes("<")) return nodes.map(() => null);
  return applyEdits(nodes, scanParagraph(whole, ctx));
}
function writeParagraph(tokens, nodes, ctx) {
  const res = fillParagraph(nodes.map((n) => unescapeXml(tokens[n.text])), ctx);
  res.forEach((r, k) => {
    if (r === null) return;
    const n = nodes[k];
    tokens[n.text] = escapeXml(r);
    if (!/xml:space=/.test(tokens[n.open])) tokens[n.open] = tokens[n.open].replace(/^<w:t\b/, '<w:t xml:space="preserve"');
  });
  return res.some((r) => r !== null);
}
var isParaOpen = (t) => /^<w:p[\s>]/.test(t) && !t.endsWith("/>");
var isTextNode = (tokens, i) => /^<w:t[\s>]/.test(tokens[i]) && !tokens[i].endsWith("/>") && tokens[i + 1]?.startsWith("<") === false;
function scanToken(tokens, i, stack, ctx) {
  const t = tokens[i];
  if (!t.startsWith("<")) return false;
  if (isParaOpen(t)) stack.push([]);
  else if (t === "</w:p>") {
    const nodes = stack.pop();
    return !!nodes?.length && writeParagraph(tokens, nodes, ctx);
  } else if (stack.length && isTextNode(tokens, i)) stack[stack.length - 1].push({ open: i, text: i + 1 });
  return false;
}
function fillXml(xml, ctx) {
  const tokens = xml.match(/<[^>]*>|[^<]+/g) ?? [];
  const stack = [];
  let changed = false;
  for (let i = 0; i < tokens.length; i++) if (scanToken(tokens, i, stack, ctx)) changed = true;
  return changed ? tokens.join("") : null;
}
function fillDocx(docx, ctx) {
  let total = 0;
  const files = unzipSync(docx, {
    filter: (f) => {
      total += f.originalSize;
      if (total > MAX_DOCX_BYTES) throw new PrepareError("template.docx is too large when decompressed", 1);
      return true;
    }
  });
  const dec = new TextDecoder("utf-8");
  const enc = new TextEncoder();
  const out = {};
  for (const [name, data] of Object.entries(files)) {
    let bytes = data;
    if (PART.test(name)) {
      const filled = fillXml(dec.decode(data), ctx);
      if (filled !== null) bytes = enc.encode(filled);
    }
    out[name] = [bytes, { level: /^word\/media\//.test(name) ? 0 : 6, mtime: new Date(1980, 0, 1) }];
  }
  return zipSync(out);
}
function templateHasImages(docx) {
  const rels = unzipSync(docx, { filter: (f) => f.name === "word/_rels/document.xml.rels" })["word/_rels/document.xml.rels"];
  return !!rels && /relationships\/image"/.test(new TextDecoder().decode(rels));
}
function segments(md) {
  const lines2 = md.split("\n");
  const out = [];
  let prose = [];
  const flush = () => {
    if (prose.length) out.push({ fence: false, text: prose.join("\n"), info: "", code: "" });
    prose = [];
  };
  for (let i = 0; i < lines2.length; i++) {
    const open = /^(\s*)(`{3,}|~{3,})\s*(.*?)\s*$/.exec(lines2[i]);
    if (!open) {
      prose.push(lines2[i]);
      continue;
    }
    let j = i + 1;
    const close = new RegExp(`^\\s*${open[2][0]}{${open[2].length},}\\s*$`);
    while (j < lines2.length && !close.test(lines2[j])) j++;
    flush();
    out.push({ fence: true, text: lines2.slice(i, Math.min(j, lines2.length - 1) + 1).join("\n"), info: open[3].split(/\s+/)[0].toLowerCase(), code: lines2.slice(i + 1, j).join("\n") });
    i = j;
  }
  flush();
  return out;
}
var MAX_IMAGE_BYTES = 20 * 1024 * 1024;
var IMAGE_TYPES = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".bmp": "image/bmp" };
async function prepareDoc(argv, partial = {}) {
  const deps = { ...defaultPrepareDeps(partial.env ?? process.env), ...partial };
  let parsed;
  try {
    parsed = parsePrepareArgs(argv);
  } catch (e) {
    deps.stderr(`aiplus-office doc prepare: ${e.message}
${DOC_USAGE}
`);
    return 2;
  }
  if ("help" in parsed) {
    deps.stderr(`${DOC_USAGE}
`);
    return 0;
  }
  try {
    const report = await runPrepare(parsed, deps);
    if (parsed.json) deps.stdout(`${JSON.stringify(report)}
`);
    else deps.stdout(summary(report, parsed.out));
    return report.unresolved.length && !parsed.allowMissing ? 1 : 0;
  } catch (e) {
    if (e instanceof PrepareError) {
      deps.stderr(`aiplus-office doc prepare: ${e.message}
`);
      return e.code;
    }
    deps.stderr(`aiplus-office doc prepare: ${e.message}
`);
    return 1;
  }
}
function summary(r, out) {
  const lines2 = [`template: ${r.templatePath}`, `out: ${out}`];
  if (r.defaulted.length) lines2.push(`defaulted: ${r.defaulted.join(", ")}`);
  if (r.unresolved.length) lines2.push(`unresolved: ${r.unresolved.join(", ")}`);
  lines2.push(`mermaid: ${r.mermaid.rendered} rendered, ${r.mermaid.unrendered} unrendered \xB7 images: ${r.images.inlined} inlined, ${r.images.skipped.length} skipped, ${r.images.remote.length} remote`);
  for (const w of r.warnings) lines2.push(`warning: ${w}`);
  return `${lines2.join("\n")}
`;
}
function collectVariables(p, fm, meta, inputPath, deps) {
  const v = { values: /* @__PURE__ */ new Map(), sources: /* @__PURE__ */ new Map(), ignored: /* @__PURE__ */ new Set() };
  const set = (name, value, source) => {
    v.values.set(name, value);
    v.sources.set(name, source);
  };
  for (const [k, d] of meta.defaults) set(k, d, "default");
  const now = deps.now();
  const pad = (n) => String(n).padStart(2, "0");
  set("$date", formatDate(now, typeof fm.language === "string" ? fm.language : "en"), "system");
  set("$fileName", path6.basename(inputPath), "system");
  set("$year", String(now.getFullYear()), "system");
  set("$month", pad(now.getMonth() + 1), "system");
  set("$day", pad(now.getDate()), "system");
  const fmVar = (k, val) => {
    if (isScalar(val) && VAR_NAME.test(k)) set(k, String(val), "frontmatter");
    else v.ignored.add(k);
  };
  for (const [k, val] of Object.entries(fm)) {
    if (k === "variables" && val && typeof val === "object" && !Array.isArray(val)) {
      for (const [vk, vv] of Object.entries(val)) fmVar(vk, vv);
    } else if (ENGINE_ONLY_KEYS.has(k)) v.ignored.add(k);
    else if (!HANDLED_KEYS.has(k)) fmVar(k, val);
  }
  for (const [k, val] of p.vars) set(k, val, "cli");
  return v;
}
function resolveTemplate(p, fm, mdDir, conf, deps) {
  const name = p.template ?? (typeof fm.template === "string" ? fm.template : "default");
  if (!TEMPLATE_NAME.test(name)) throw new PrepareError(`invalid template name "${name}" (letters, digits, _ and - only)`, 2);
  const dir = path6.join(resolveTemplatesDir(p, fm, mdDir, conf, deps), name);
  const file = path6.join(dir, "template.docx");
  if (!fs6.existsSync(file)) throw new PrepareError(`template not found: ${file}`, 1);
  return { name, dir, path: file };
}
function makePlace(report, outDir) {
  return (bytes, mime, alt) => {
    if (!report.pictures) return `![${alt}](data:${mime};base64,${Buffer.from(bytes).toString("base64")})`;
    const n = String(report.pictures.length + 1).padStart(4, "0");
    const file = path6.posix.join("images", `${n}${mime === "image/jpeg" ? ".jpg" : `.${mime.split("/")[1]}`}`);
    fs6.mkdirSync(path6.join(outDir, "images"), { recursive: true });
    writeAtomic(path6.join(outDir, file), bytes);
    report.pictures.push({ marker: `CRAFTIMG${n}`, file, alt });
    return `CRAFTIMG${n}`;
  };
}
function documentTitle(fm, body, inputPath) {
  for (const k of ["document_title", "document_name"]) if (typeof fm[k] === "string") return fm[k];
  return /^#\s+(.+)$/m.exec(body)?.[1]?.trim() ?? path6.basename(inputPath, path6.extname(inputPath));
}
async function runPrepare(p, deps) {
  const inputPath = path6.resolve(deps.cwd, p.input);
  let text;
  try {
    text = fs6.readFileSync(inputPath, "utf8");
  } catch {
    throw new PrepareError(`cannot read ${p.input}`, 1);
  }
  const mdDir = path6.dirname(inputPath);
  const { data: fm, body: rawBody } = splitFrontmatter(text);
  const conf = confinement(mdDir, p.allowPaths, deps.cwd);
  const template = resolveTemplate(p, fm, mdDir, conf, deps);
  const meta = readTemplateMeta(template.dir);
  const vars = collectVariables(p, fm, meta, inputPath, deps);
  const ctx = { values: vars.values, angle: angleNames(meta), unresolved: /* @__PURE__ */ new Set(), ignored: vars.ignored };
  const templateBytes = fs6.readFileSync(template.path);
  const filled = fillDocx(templateBytes, ctx);
  const report = {
    template: template.name,
    templatePath: template.path,
    vars: {},
    defaulted: [],
    unresolved: [],
    ignored: [],
    warnings: [],
    toc: { enabled: fm.enable_toc === true || fm.enable_toc === "true", heading: typeof fm.toc_heading === "string" ? fm.toc_heading : "Table of Contents", levels: 3 },
    title: "",
    mermaid: { rendered: 0, unrendered: 0 },
    images: { inlined: 0, skipped: [], remote: [] }
  };
  if (templateHasImages(templateBytes)) report.pictures = [];
  const outDir = path6.resolve(deps.cwd, p.out);
  const body = await prepareBody(rawBody, { place: makePlace(report, outDir), mdDir, conf, report, ctx, deps });
  report.title = documentTitle(fm, body, inputPath);
  for (const [k, src] of [...vars.sources].sort(([a], [b]) => a.localeCompare(b))) report.vars[k] = src;
  report.defaulted = [...vars.sources].filter(([, src]) => src === "default").map(([k]) => k).sort();
  report.unresolved = [...ctx.unresolved].sort();
  report.ignored = [...vars.ignored].sort();
  fs6.mkdirSync(outDir, { recursive: true });
  writeAtomic(path6.join(outDir, "template.filled.docx"), filled);
  writeAtomic(path6.join(outDir, "body.md"), body);
  writeAtomic(path6.join(outDir, "prepare.json"), `${JSON.stringify(report, null, 2)}
`);
  return report;
}
function writeAtomic(file, data) {
  const tmp = `${file}.${randomBytes(6).toString("hex")}.tmp`;
  fs6.writeFileSync(tmp, data, { flag: "wx" });
  fs6.renameSync(tmp, file);
}
async function prepareBody(raw, c) {
  const out = [];
  for (const seg of segments(raw)) {
    if (!seg.fence) {
      out.push(substitute(inlineImages(seg.text, c), c));
    } else if (seg.info === "mermaid") {
      out.push(await renderMermaid(seg, c));
    } else {
      if (seg.info === "plantuml" || seg.info === "puml") c.report.warnings.push("PlantUML block left as code (PlantUML is not rendered)");
      out.push(seg.text);
    }
  }
  return out.join("\n");
}
function substitute(prose, c) {
  return prose.replace(MUSTACHE, (whole, name) => {
    if (name.startsWith("logo:") || name === "$toc") {
      c.ctx.ignored.add(name);
      return whole;
    }
    const v = c.ctx.values.get(name);
    if (v === void 0) {
      c.ctx.unresolved.add(name);
      return whole;
    }
    if (/!\[[^\]]*\]\(|^\s*(`{3,}|~{3,})/m.test(v)) c.report.warnings.push(`variable "${name}" contains image/diagram syntax; left literal, not inlined or rendered`);
    return v;
  });
}
function resolveImage(ref, c) {
  let file;
  try {
    file = /^file:/i.test(ref) ? fileURLToPath2(ref) : path6.resolve(c.mdDir, safeDecode(ref));
  } catch {
    return { skip: "invalid path" };
  }
  if (!fs6.existsSync(file)) return { skip: "file not found" };
  const real = fs6.realpathSync(file);
  if (!c.conf.allows(real)) return { skip: "outside the input's directory and --allow-path" };
  const mime = IMAGE_TYPES[path6.extname(real).toLowerCase()];
  if (!mime) return { skip: "unsupported image type" };
  if (fs6.statSync(real).size > MAX_IMAGE_BYTES) return { skip: "image too large" };
  return { real, mime };
}
function inlineImages(prose, c) {
  return prose.replace(/!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?((?:\s+"[^"]*")?)\s*\)/g, (whole, alt, ref) => {
    if (/^data:/i.test(ref)) return whole;
    if (/^https?:\/\//i.test(ref)) {
      c.report.images.remote.push(ref);
      return whole;
    }
    const img = resolveImage(ref, c);
    if ("skip" in img) {
      c.report.images.skipped.push({ path: ref, reason: img.skip });
      return whole;
    }
    c.report.images.inlined++;
    return c.place(fs6.readFileSync(img.real), img.mime, alt);
  });
}
var safeDecode = (s) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};
async function renderViaMmdc(source, deps) {
  const mmdc = deps.which("mmdc");
  if (!mmdc) return { error: "mmdc not found on PATH: Mermaid blocks left as code (install @mermaid-js/mermaid-cli or accept code blocks)" };
  const tmp = fs6.mkdtempSync(path6.join(os3.tmpdir(), "aiplus-office-mmd-"));
  try {
    const input = path6.join(tmp, "diagram.mmd");
    const output = path6.join(tmp, "diagram.png");
    fs6.writeFileSync(input, source);
    await deps.run(mmdc, ["-i", input, "-o", output, "-b", "white", "-w", "1400", "-s", "2"], { timeout: 12e4 });
    return fs6.existsSync(output) ? { png: fs6.readFileSync(output) } : { error: "mmdc exited 0 but wrote no image: block left as code" };
  } catch (e) {
    return { error: `mmdc failed (${e.message.split("\n")[0].slice(0, 120)}): block left as code` };
  } finally {
    fs6.rmSync(tmp, { recursive: true, force: true });
  }
}
async function renderMermaid(seg, c) {
  const { mermaid, warnings } = c.report;
  const res = await renderViaMmdc(seg.code, c.deps);
  if ("error" in res) {
    mermaid.unrendered++;
    if (!warnings.includes(res.error)) warnings.push(res.error);
    return seg.text;
  }
  mermaid.rendered++;
  return c.place(res.png, "image/png", "diagram");
}

// src/jq.ts
import * as fs7 from "node:fs";
import * as path7 from "node:path";
var JQ_VERSION = "1.8.2";
var JQ_ASSETS = {
  "linux/x64": { asset: "jq-linux-amd64", sha256: "b1c22172dd303f3be49e935aa56aa48a8b7a46e0bc838b4997d3bb451495870f" },
  "linux/arm64": { asset: "jq-linux-arm64", sha256: "8b85c817833814ddca00a144c33705546355afccf0cf39b188f3cdb48b852309" },
  "darwin/x64": { asset: "jq-macos-amd64", sha256: "e94b266e3c26690550006abe63152b782280f4e14374accdf04cbde844f00bc0" },
  "darwin/arm64": { asset: "jq-macos-arm64", sha256: "2d75340ba57a4b4b4c8708a21c2dc8e958a48aaa8bba13b27f77f6e4c0eca07e" },
  "win32/x64": { asset: "jq-windows-amd64.exe", sha256: "a6fc67fedaf9128a3309a1e2ebb8b986aeccf70122ee46d2cb4849e423f0c627" },
  "win32/arm64": { asset: "jq-windows-arm64.exe", sha256: "083b5377392bc57cf27052b6d20a2d927770683bca844632901ff38b4b7b0ac7" }
};
var MAX_JQ_BYTES = 16 * 1024 * 1024;
function jqUrl(asset) {
  return `https://github.com/jqlang/jq/releases/download/jq-${JQ_VERSION}/${asset}`;
}
function jqPath(deps) {
  return path7.join(craftRoot(deps), "jq", JQ_VERSION, exe("jq", deps.platform));
}
function installedJq(deps) {
  const p = jqPath(deps);
  try {
    const st = fs7.statSync(p);
    if (!st.isFile() || st.size === 0) return void 0;
    return deps.platform === "win32" || (st.mode & 73) !== 0 ? p : void 0;
  } catch {
    return void 0;
  }
}
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function commitJq(tree, finalDir, deps) {
  for (let attempt = 0; ; attempt++) {
    if (installedJq(deps)) return;
    fs7.rmSync(finalDir, { recursive: true, force: true });
    try {
      fs7.renameSync(tree, finalDir);
      return;
    } catch (e) {
      const code = e.code;
      if (installedJq(deps)) return;
      if (attempt >= 4 || !["EPERM", "EBUSY", "EACCES", "ENOTEMPTY", "EEXIST"].includes(code ?? "")) throw e;
      await sleep(250 * (attempt + 1));
    }
  }
}
async function ensureJq(deps, assets = JQ_ASSETS) {
  const host = `${deps.platform}/${deps.arch}`;
  const entry = assets[host];
  if (!entry) throw new ProvisionError(`unsupported platform: ${host} has no jq ${JQ_VERSION} build here; install jq yourself`);
  const binary = jqPath(deps);
  if (installedJq(deps)) return binary;
  const finalDir = path7.dirname(binary);
  const parent = path7.dirname(finalDir);
  return singleFlight(`install:${finalDir}`, async () => {
    if (installedJq(deps)) return binary;
    fs7.mkdirSync(parent, { recursive: true });
    sweepStaleStaging(parent, deps.now());
    const staging = path7.join(parent, `.staging-${process.pid}-${deps.randomId()}`);
    try {
      const tree = path7.join(staging, "tree");
      fs7.mkdirSync(tree, { recursive: true });
      const dest = path7.join(tree, path7.basename(binary));
      deps.log(`[aiplus-office] downloading jq ${JQ_VERSION} ${entry.asset} from github.com/jqlang/jq`);
      const actual = await downloadFile(deps, jqUrl(entry.asset), dest, MAX_JQ_BYTES);
      if (actual !== entry.sha256) throw new ProvisionError(`checksum mismatch for ${entry.asset}: expected ${entry.sha256}, got ${actual}`);
      if (deps.platform !== "win32") fs7.chmodSync(dest, 493);
      await commitJq(tree, finalDir, deps);
      return binary;
    } finally {
      fs7.rmSync(staging, { recursive: true, force: true });
    }
  });
}

// src/status.ts
import * as fs8 from "node:fs";
import * as path8 from "node:path";
function dirBytes(dir) {
  let total = 0;
  let entries;
  try {
    entries = fs8.readdirSync(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const e of entries) {
    const p = path8.join(dir, e.name);
    try {
      if (e.isDirectory()) total += dirBytes(p);
      else if (e.isFile()) total += fs8.statSync(p).size;
    } catch {
    }
  }
  return total;
}
function appStatus(app2, deps) {
  const root = cacheRoot(app2, deps);
  const installed = installedVersions(app2, root, deps.platform);
  const prefix = envPrefix(app2);
  const override = deps.env[`${prefix}_BIN`];
  const pin = deps.env[`${prefix}_VERSION`]?.trim();
  let wouldUse;
  if (override) wouldUse = { version: null, source: "override" };
  else if (pin) wouldUse = { version: normaliseVersion(pin, app2.name), source: "pin" };
  else {
    const cached = readLatestCache(root, deps.now(), repoFor(app2, deps.platform, deps.arch));
    if (cached) wouldUse = { version: normaliseVersion(cached, app2.name), source: "latest-cached" };
    else wouldUse = { version: null, source: "download" };
  }
  return { app: app2.id, name: app2.name, installed, cacheBytes: dirBytes(root), wouldUse, cache: root, ...override ? { override } : {} };
}
function statusRoot(deps) {
  return craftRoot(deps);
}
function desktopCacheRoots(deps) {
  if (deps.env.AIPLUS_OFFICE_HOME || deps.platform !== "win32") return [];
  const packages = path8.join(deps.env.LOCALAPPDATA || path8.join(deps.homedir(), "AppData", "Local"), "Packages");
  let names;
  try {
    names = fs8.readdirSync(packages);
  } catch {
    return [];
  }
  return names.filter((n) => /^Claude_/i.test(n)).sort().map((n) => path8.join(packages, n, "LocalCache", "Local", "aiplus-office")).filter((p) => {
    try {
      return fs8.statSync(p).isDirectory();
    } catch {
      return false;
    }
  });
}

// src/verify.ts
import * as fs10 from "node:fs";
import * as path10 from "node:path";

// src/hu-guards.ts
import * as fs9 from "node:fs";
import * as path9 from "node:path";
var HU_LONG = /[őűŐŰ]/;
var MONTHS2 = "janu\xE1r|febru\xE1r|m\xE1rcius|\xE1prilis|m\xE1jus|j\xFAnius|j\xFAlius|augusztus|szeptember|okt\xF3ber|november|december";
var SIGN = "[-+\u2212]?";
var SPACE = "[ \xA0\u202F]";
var NUMBER_PATTERNS = [
  new RegExp(`^${SIGN}\\d{1,3}(?:${SPACE}\\d{3})+(?:,\\d+)?$`),
  // 1 330,50 · 12 000
  new RegExp(`^${SIGN}\\d+,\\d+$`),
  // 1330,50
  new RegExp(`^${SIGN}\\d{1,3}(?:\\.\\d{3})+,\\d+$`),
  // 1.330,50
  new RegExp(`^${SIGN}\\d{1,3}(?:\\.\\d{3}){2,}$`),
  // 1.330.000
  new RegExp(`^${SIGN}\\d+,\\d+${SPACE}?%$`)
  // 27,5 %
];
var DATE_PATTERNS = [
  /^\d{4}\.\s?\d{1,2}\.\s?\d{1,2}\.?$/,
  // 2026.10.31. · 2026. 10. 31.
  /^\d{1,2}\.\s?\d{1,2}\.\s?\d{4}\.?$/,
  // 31.10.2026
  new RegExp(`^\\d{4}\\.\\s?(?:${MONTHS2})\\s?\\d{1,2}\\.?$`, "i")
  // 2026. október 31.
];
var CURRENCY = new RegExp(`${SPACE}?(?:Ft|HUF|forint)\\.?$`, "i");
function huKind(raw) {
  const t = raw.trim();
  if (t === "") return null;
  if (DATE_PATTERNS.some((p) => p.test(t))) return "date";
  const hadCurrency = CURRENCY.test(t);
  const s = t.replace(CURRENCY, "").trim();
  if (NUMBER_PATTERNS.some((p) => p.test(s))) return "number";
  if (new RegExp(`^${SIGN}\\d+(?:\\.\\d+)?$`).test(s)) return hadCurrency ? "number" : "digits";
  return null;
}
var ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
function decode(s) {
  return s.replace(
    /&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi,
    (_, e) => e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? Number.parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENTITIES[e.toLowerCase()]
  );
}
function texts(xml) {
  return [...xml.matchAll(/<(?:\w+:)?t(?:\s[^>]*)?>([^<]*)<\/(?:\w+:)?t>/g)].map((m) => decode(m[1]));
}
function unzip(buf) {
  if (buf.length < 4 || buf[0] !== 80 || buf[1] !== 75) return void 0;
  try {
    return unzipSync(buf);
  } catch {
    return void 0;
  }
}
var utf8 = (b) => b ? new TextDecoder().decode(b) : "";
function sourceText(file, buf = fs9.readFileSync(file)) {
  const zip = unzip(buf);
  if (zip) {
    const parts = Object.keys(zip).filter((n) => n.endsWith(".xml") && /^(xl\/(sharedStrings|worksheets\/|charts\/)|word\/|ppt\/(slides|charts|notesSlides)\/)/.test(n)).sort();
    return parts.map((n) => texts(utf8(zip[n])).join(" ")).join("\n");
  }
  const raw = utf8(buf);
  return /\.html?$/i.test(path9.extname(file)) ? decode(raw.replace(/<[^>]*>/g, " ")) : raw;
}
function huWords(text) {
  const seen = /* @__PURE__ */ new Set();
  for (const w of text.normalize("NFC").split(/[^\p{L}\p{N}]+/u)) if (w && HU_LONG.test(w)) seen.add(w);
  return [...seen];
}
function huWordsFrom(file) {
  return huWords(sourceText(file));
}
function missingWords(words, pdfText) {
  const have = new Set(pdfText.normalize("NFC").split(/[^\p{L}\p{N}]+/u));
  return words.filter((w) => !have.has(w));
}
var colNum = (letters) => [...letters.toUpperCase()].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
function formulaRanges(formula, ownSheet) {
  const f = formula.replace(/"(?:[^"]|"")*"/g, '""');
  const out = [];
  const sheetPart = "(?:(?:'((?:[^']|'')+)'|([A-Za-z_\\u00C0-\\u024F][\\w.\\u00C0-\\u024F]*))!)?";
  const cellRe = new RegExp(`(?<![\\w.$])${sheetPart}\\$?([A-Z]{1,3})\\$?(\\d+)(?::\\$?([A-Z]{1,3})\\$?(\\d+))?(?![\\w(])`, "g");
  for (const m of f.matchAll(cellRe)) {
    const sheet = (m[1]?.replace(/''/g, "'") ?? m[2]) || ownSheet;
    const [c1, r1] = [colNum(m[3]), Number(m[4])];
    const [c2, r2] = m[5] ? [colNum(m[5]), Number(m[6])] : [c1, r1];
    out.push({ sheet, c1: Math.min(c1, c2), r1: Math.min(r1, r2), c2: Math.max(c1, c2), r2: Math.max(r1, r2) });
  }
  const colRe = new RegExp(`(?<![\\w.$])${sheetPart}\\$?([A-Z]{1,3}):\\$?([A-Z]{1,3})(?![\\w(])`, "g");
  for (const m of f.matchAll(colRe)) {
    const sheet = (m[1]?.replace(/''/g, "'") ?? m[2]) || ownSheet;
    const [a, b] = [colNum(m[3]), colNum(m[4])];
    out.push({ sheet, c1: Math.min(a, b), r1: 1, c2: Math.max(a, b), r2: 1048576 });
  }
  return out;
}
function sheetParts(zip) {
  const wb = utf8(zip["xl/workbook.xml"]);
  const rels = utf8(zip["xl/_rels/workbook.xml.rels"]);
  const target = /* @__PURE__ */ new Map();
  for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) {
    const id = /\bId="([^"]+)"/.exec(m[0])?.[1];
    const t = /\bTarget="([^"]+)"/.exec(m[0])?.[1];
    if (id && t) target.set(id, t.startsWith("/") ? t.slice(1) : path9.posix.join("xl", t));
  }
  const out = [];
  for (const m of wb.matchAll(/<sheet\b[^>]*>/g)) {
    const name = decode(/\bname="([^"]*)"/.exec(m[0])?.[1] ?? "");
    const rid = /\br:id="([^"]+)"/.exec(m[0])?.[1] ?? /\bid="([^"]+)"/.exec(m[0])?.[1];
    const part = rid ? target.get(rid) : void 0;
    if (part && zip[part]) out.push({ name, part });
  }
  return out;
}
function scanHuNumbers(buf) {
  const zip = unzip(buf);
  if (!zip || !zip["xl/workbook.xml"]) throw new Error("not an XLSX workbook");
  const sst = [...utf8(zip["xl/sharedStrings.xml"]).matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => texts(m[1]).join(""));
  const sheets = sheetParts(zip);
  const cells = /* @__PURE__ */ new Map();
  const ranges = [];
  for (const { name, part } of sheets) {
    const list = [];
    for (const m of utf8(zip[part]).matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = m[1];
      const body = m[2] ?? "";
      const ref = /\br="([A-Z]{1,3})(\d+)"/.exec(attrs);
      if (!ref) continue;
      const t = /\bt="([^"]+)"/.exec(attrs)?.[1] ?? "n";
      const f = /<f\b[^>]*>([^<]*)<\/f>/.exec(body)?.[1];
      if (f) ranges.push(...formulaRanges(decode(f), name));
      const v = /<v>([^<]*)<\/v>/.exec(body)?.[1];
      const cell = { col: colNum(ref[1]), row: Number(ref[2]), ref: `${ref[1]}${ref[2]}`, type: "other" };
      if (t === "s" && v !== void 0) Object.assign(cell, { type: "text", text: sst[Number(v)] ?? "" });
      else if (t === "inlineStr") Object.assign(cell, { type: "text", text: texts(body).join("") });
      else if (t === "n" && (v !== void 0 || f)) cell.type = "number";
      list.push(cell);
    }
    cells.set(name, list);
  }
  const out = [];
  for (const [sheet, list] of cells) {
    const numberCols = new Set(list.filter((c) => c.type === "number").map((c) => c.col));
    const kinds = list.map((c) => c.type === "text" ? huKind(c.text ?? "") : null);
    const perCol = /* @__PURE__ */ new Map();
    list.forEach((c, i) => {
      if (kinds[i] === "number" || kinds[i] === "date") perCol.set(c.col, (perCol.get(c.col) ?? 0) + 1);
    });
    list.forEach((c, i) => {
      const kind = kinds[i];
      if (!kind) return;
      const read = ranges.some((r) => r.sheet === sheet && c.col >= r.c1 && c.col <= r.c2 && c.row >= r.r1 && c.row <= r.r2);
      let reason;
      if (read) reason = "formula range";
      else if (kind !== "digits" && numberCols.has(c.col)) reason = "number column";
      else if (kind !== "digits" && (perCol.get(c.col) ?? 0) >= 2) reason = "column of such cells";
      if (reason) out.push({ sheet, cell: c.ref, text: c.text ?? "", kind, reason });
    });
  }
  return out;
}

// src/verify.ts
var VERIFY_USAGE = `usage: aiplus-office verify <file> <assertion\u2026> [--json]

media:     --duration <s>[\xB1tol]   (default tolerance 0.05 s)   --has-video  --has-audio  --no-audio
           --size <W>x<H>  --fps <n>  --codec <video|audio>=<name>  --alpha
           --loudness <LUFS>[\xB1tol] (integrated, default tolerance 1 LU)
           --max-peak <dBFS>      (sample peak at or below)
           --silent-below <dBFS>  (maximum volume below the threshold)
visual:    --frame-diff <t>:<ref>[@<rt>]<op><pct>   op > (content must differ) or < (must match);
           pct = share of pixels whose luma differs by more than 40/255
documents: --pages <n>  --text-contains <string>   (PDF, via pdfcraft-cli)
           --hu-glyphs <source>   every word with \u0151/\u0171/\u0150/\u0170 in <source> (xlsx/docx/pptx/txt/md/csv/html) is in the PDF's text
           --hu-numbers           (XLSX) no Hungarian-format number or date (\u201E1 330,50", \u201E2026.10.31.") stored as text
                                  where a formula reads it or its column holds numbers

exit: 0 all pass \xB7 1 failed/missing file \xB7 2 usage \xB7 3 probe tool missing (ffprobe, ffmpeg, pdfcraft)`;
var PROBE_TIMEOUT_MS = 6e4;
var DECODE_TIMEOUT_MS = 10 * 6e4;
var MAX_FRAME_WIDTH = 1024;
function defaultVerifyDeps() {
  return {
    exec: (file, args, opts) => execFileAsync(file, args, { maxBuffer: 64 * 1024 * 1024, timeout: PROBE_TIMEOUT_MS, ...opts }),
    stdout: (t) => process.stdout.write(t),
    stderr: (t) => process.stderr.write(t),
    provisionPdfcraft: () => provision("pdfcraft"),
    exists: (f) => fs10.existsSync(f)
  };
}
var FLAG_ONLY = /* @__PURE__ */ new Set(["has-video", "has-audio", "no-audio", "alpha", "hu-numbers"]);
var WITH_VALUE = /* @__PURE__ */ new Set(["duration", "size", "fps", "codec", "loudness", "max-peak", "silent-below", "frame-diff", "pages", "text-contains", "hu-glyphs"]);
var UsageError = class extends Error {
};
var NUM = "-?\\d+(?:\\.\\d+)?";
var TOL_RE = new RegExp(`^(${NUM})(?:(?:\xB1|\\+-|\\+/-)(\\d+(?:\\.\\d+)?))?$`);
function num(raw, flag) {
  if (!new RegExp(`^${NUM}$`).test(raw)) throw new UsageError(`--${flag} needs a number, got "${raw}"`);
  return Number.parseFloat(raw);
}
function withTol(raw, flag, defaultTol) {
  const m = TOL_RE.exec(raw);
  if (!m) throw new UsageError(`--${flag} needs <number>[\xB1tolerance], got "${raw}"`);
  return { value: Number.parseFloat(m[1]), tol: m[2] === void 0 ? defaultTol : Number.parseFloat(m[2]) };
}
function parseAssertion(flag, raw) {
  if (FLAG_ONLY.has(flag)) return { kind: flag };
  const v = raw;
  switch (flag) {
    case "duration":
      return { kind: "duration", ...withTol(v, flag, 0.05), raw: v };
    case "loudness":
      return { kind: "loudness", ...withTol(v, flag, 1), raw: v };
    case "size": {
      const m = /^(\d+)[xX×](\d+)$/.exec(v);
      if (!m) throw new UsageError(`--size needs <W>x<H>, got "${v}"`);
      return { kind: "size", w: Number(m[1]), h: Number(m[2]) };
    }
    case "fps":
      return { kind: "fps", value: num(v, flag) };
    case "codec": {
      const m = /^(video|audio)=(.+)$/.exec(v);
      if (!m) throw new UsageError(`--codec needs video=<name> or audio=<name>, got "${v}"`);
      return { kind: "codec", stream: m[1], name: m[2].toLowerCase() };
    }
    case "max-peak":
      return { kind: "max-peak", value: num(v, flag) };
    case "silent-below":
      return { kind: "silent-below", value: num(v, flag) };
    case "pages": {
      if (!/^\d+$/.test(v)) throw new UsageError(`--pages needs a whole number, got "${v}"`);
      return { kind: "pages", value: Number(v) };
    }
    case "text-contains":
      if (v === "") throw new UsageError("--text-contains needs a non-empty string");
      return { kind: "text-contains", value: v };
    case "hu-glyphs":
      if (v === "") throw new UsageError("--hu-glyphs needs the source file (the workbook, document or text the PDF was made from)");
      return { kind: "hu-glyphs", source: v };
    case "frame-diff": {
      const m = /^(\d+(?:\.\d+)?):(.+?)(?:@(\d+(?:\.\d+)?))?([<>])(\d+(?:\.\d+)?)$/.exec(v);
      if (!m) throw new UsageError(`--frame-diff needs <t>:<ref>[@<rt>]<op><pct> (op < or >), got "${v}"`);
      return { kind: "frame-diff", t: Number(m[1]), ref: m[2], rt: m[3] === void 0 ? Number(m[1]) : Number(m[3]), op: m[4], pct: Number(m[5]), raw: v };
    }
    default:
      throw new UsageError(`unknown assertion --${flag}`);
  }
}
function parseVerifyArgs(argv) {
  let file;
  let json = false;
  const assertions = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") return { help: true };
    if (a === "--json") {
      json = true;
      continue;
    }
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      const flag = eq === -1 ? a.slice(2) : a.slice(2, eq);
      if (!FLAG_ONLY.has(flag) && !WITH_VALUE.has(flag)) throw new UsageError(`unknown assertion --${flag}`);
      if (FLAG_ONLY.has(flag)) {
        if (eq !== -1) throw new UsageError(`--${flag} takes no value`);
        assertions.push(parseAssertion(flag, void 0));
      } else {
        const value = eq === -1 ? argv[++i] : a.slice(eq + 1);
        if (value === void 0) throw new UsageError(`--${flag} needs a value`);
        assertions.push(parseAssertion(flag, value));
      }
      continue;
    }
    if (file !== void 0) throw new UsageError(`unexpected argument "${a}" (one file per call)`);
    file = a;
  }
  if (file === void 0) throw new UsageError("no file given");
  if (assertions.length === 0) throw new UsageError("no assertion given");
  for (const a of assertions) {
    if (a.kind === "frame-diff") a.ref = path10.resolve(a.ref);
    if (a.kind === "hu-glyphs") a.source = path10.resolve(a.source);
  }
  return { file: path10.resolve(file), assertions, json };
}
var ToolMissing = class extends Error {
  tool;
  constructor(tool) {
    super(`required tool not available: ${tool}`);
    this.tool = tool;
  }
};
var ALPHA_PIX_FMT = /(yuva|gbrap|rgba|bgra|argb|abgr|ya8|ya16|ayuv|pal8)/;
var fmt = (n) => Number.isInteger(n) ? n.toFixed(1) : String(Number(n.toFixed(3)));
var tolText = (raw) => raw.replace("+/-", "\xB1").replace("+-", "\xB1");
var ProbeTimeout = class extends Error {
};
async function run(deps, tool, args, opts) {
  const bare = !path10.isAbsolute(tool);
  try {
    return await deps.exec(bare ? exe(tool) : tool, args, opts);
  } catch (e) {
    const err2 = e;
    if (err2.code === "ENOENT") throw new ToolMissing(tool);
    if (err2.killed && err2.signal) throw new ProbeTimeout(`${tool} timed out`);
    throw e;
  }
}
function makeProber(deps, file) {
  let probe;
  let volume;
  let loud;
  return {
    probe: () => probe ??= run(deps, "ffprobe", ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", file]).then(
      (r) => JSON.parse(r.stdout.toString())
    ),
    /** Maximum volume in dB (`null` = digital silence / `-inf`). */
    volume: () => volume ??= run(deps, "ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-vn", "-af", "volumedetect", "-f", "null", "-"], { timeout: DECODE_TIMEOUT_MS }).then((r) => {
      const m = /max_volume:\s*(-?\d+(?:\.\d+)?|-inf) dB/.exec(r.stderr.toString());
      if (!m || m[1] === "-inf") return null;
      return Number.parseFloat(m[1]);
    }),
    /** Integrated loudness in LUFS (`null` = silence). */
    loudness: () => loud ??= run(deps, "ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-vn", "-af", "ebur128", "-f", "null", "-"], { timeout: DECODE_TIMEOUT_MS }).then((r) => {
      const all = [...r.stderr.toString().matchAll(/\bI:\s+(-?\d+(?:\.\d+)?|-inf)\s+LUFS/g)];
      const last = all[all.length - 1];
      if (!last || last[1] === "-inf") return null;
      return Number.parseFloat(last[1]);
    })
  };
}
var MOVIE_FORMAT = /mov|mp4|matroska|avi|webm/;
var isStill = (p) => /image2|_pipe|png|jpeg|webp|tiff|bmp/.test(p.format.format_name ?? "") && !MOVIE_FORMAT.test(p.format.format_name ?? "");
async function grayFrame(deps, file, t, w, h, still) {
  const args = ["-v", "error", ...still ? [] : ["-ss", String(t)], "-i", file, "-frames:v", "1", "-vf", `scale=${w}:${h}:flags=bilinear,format=gray`, "-f", "rawvideo", "-"];
  const r = await run(deps, "ffmpeg", args, { encoding: "buffer", timeout: DECODE_TIMEOUT_MS });
  return Buffer.isBuffer(r.stdout) ? r.stdout : Buffer.from(r.stdout);
}
var result = (assertion, expected, actual, pass) => ({ assertion, expected, actual, pass });
async function evaluate(a, file, deps, prober, pdfBin) {
  const hasAudio = async () => (await prober.probe()).streams.some((s) => s.codec_type === "audio");
  switch (a.kind) {
    case "duration": {
      const p = await prober.probe();
      const d = p.format.duration === void 0 ? Number.NaN : Number.parseFloat(p.format.duration);
      return result("--duration", tolText(a.raw), Number.isFinite(d) ? fmt(d) : "no duration", Number.isFinite(d) && Math.abs(d - a.value) <= a.tol + 1e-9);
    }
    case "has-video": {
      const n = (await prober.probe()).streams.filter((s) => s.codec_type === "video").length;
      return result("--has-video", "a video stream", n ? `${n} video stream(s)` : "no video stream", n > 0);
    }
    case "has-audio": {
      const n = (await prober.probe()).streams.filter((s) => s.codec_type === "audio").length;
      return result("--has-audio", "an audio stream", n ? `${n} audio stream(s)` : "no audio stream", n > 0);
    }
    case "no-audio": {
      const n = (await prober.probe()).streams.filter((s) => s.codec_type === "audio").length;
      return result("--no-audio", "no audio stream", n ? `${n} audio stream(s)` : "no audio stream", n === 0);
    }
    case "size": {
      const v = (await prober.probe()).streams.find((s) => s.codec_type === "video");
      return result("--size", `${a.w}x${a.h}`, v?.width && v?.height ? `${v.width}x${v.height}` : "no video stream", v?.width === a.w && v?.height === a.h);
    }
    case "fps": {
      const v = (await prober.probe()).streams.find((s) => s.codec_type === "video");
      const [n, d] = (v?.r_frame_rate ?? "0/1").split("/").map(Number);
      const fps = d ? n / d : 0;
      return result("--fps", fmt(a.value), fps ? fmt(fps) : "no frame rate", fps > 0 && Math.abs(fps - a.value) <= 0.01);
    }
    case "codec": {
      const s = (await prober.probe()).streams.find((x) => x.codec_type === a.stream);
      return result("--codec", `${a.stream}=${a.name}`, `${a.stream}=${s?.codec_name ?? "none"}`, s?.codec_name?.toLowerCase() === a.name);
    }
    case "alpha": {
      const v = (await prober.probe()).streams.find((s) => s.codec_type === "video");
      return result("--alpha", "an alpha channel", v?.pix_fmt ?? "no video stream", !!v?.pix_fmt && ALPHA_PIX_FMT.test(v.pix_fmt));
    }
    case "loudness": {
      const expected = `${tolText(a.raw)} LUFS`;
      if (!await hasAudio()) return result("--loudness", expected, "no audio stream", false);
      const l = await prober.loudness();
      return result("--loudness", expected, l === null ? "silence" : `${fmt(l)} LUFS`, l !== null && Math.abs(l - a.value) <= a.tol + 1e-9);
    }
    case "max-peak": {
      const expected = `<= ${fmt(a.value)} dBFS`;
      if (!await hasAudio()) return result("--max-peak", expected, "no audio stream", false);
      const v = await prober.volume();
      return result("--max-peak", expected, v === null ? "silence" : `${fmt(v)} dBFS`, v === null || v <= a.value + 1e-9);
    }
    case "silent-below": {
      const expected = `max volume < ${fmt(a.value)} dBFS`;
      if (!await hasAudio()) return result("--silent-below", expected, "no audio stream (silent)", true);
      const v = await prober.volume();
      return result("--silent-below", expected, v === null ? "silence" : `${fmt(v)} dBFS`, v === null || v < a.value);
    }
    case "frame-diff": {
      const p = await prober.probe();
      const v = p.streams.find((s) => s.codec_type === "video");
      if (!v?.width || !v.height) return result("--frame-diff", `${a.op}${a.pct}%`, "no video stream", false);
      const still = isStill(p);
      const fw = Math.min(v.width, MAX_FRAME_WIDTH);
      const fh = Math.max(1, Math.round(v.height * fw / v.width));
      const [x, y] = await Promise.all([grayFrame(deps, file, a.t, fw, fh, still), grayFrame(deps, a.ref, a.rt, fw, fh, still)]);
      const total = fw * fh;
      const expected = `${a.op}${a.pct}% pixels differ (${fmt(a.t)} s vs ${a.ref} @ ${fmt(a.rt)} s)`;
      if (x.length < total || y.length < total) return result("--frame-diff", expected, `no frame at ${fmt(x.length < total ? a.t : a.rt)} s`, false);
      let differing = 0;
      for (let i = 0; i < total; i++) if (Math.abs(x[i] - y[i]) > 40) differing++;
      const pct = differing / total * 100;
      return result("--frame-diff", expected, `${pct.toFixed(3)}%`, a.op === ">" ? pct > a.pct : pct < a.pct);
    }
    case "pages": {
      const bin = await pdfBin();
      const info = JSON.parse((await run(deps, bin, ["info", file])).stdout.toString());
      return result("--pages", String(a.value), info.pages === void 0 ? "unknown" : String(info.pages), info.pages === a.value);
    }
    case "text-contains": {
      const bin = await pdfBin();
      const text = (await run(deps, bin, ["text", file])).stdout.toString();
      const found = text.includes(a.value);
      return result("--text-contains", JSON.stringify(a.value), found ? "found" : "not found", found);
    }
    case "hu-glyphs": {
      const words = huWordsFrom(a.source);
      const expected = `every word with \u0151/\u0171 from ${path10.basename(a.source)} in the PDF text`;
      if (words.length === 0) return result("--hu-glyphs", expected, "the source holds no word with \u0151/\u0171", true);
      const bin = await pdfBin();
      const missing = missingWords(words, (await run(deps, bin, ["text", file])).stdout.toString());
      const list = (w) => `${w.slice(0, 10).join(", ")}${w.length > 10 ? ` (+${w.length - 10} more)` : ""}`;
      return result(
        "--hu-glyphs",
        `${expected} (${words.length} word(s))`,
        missing.length ? `missing ${missing.length}: ${list(missing)} (the letters were lost in the PDF; GridCraft's export does this)` : `all ${words.length} found`,
        missing.length === 0
      );
    }
    case "hu-numbers": {
      let cells;
      try {
        cells = scanHuNumbers(fs10.readFileSync(file));
      } catch {
        return result("--hu-numbers", "an XLSX workbook", "not an XLSX workbook", false);
      }
      const shown = cells.slice(0, 12).map((c) => `${c.sheet}!${c.cell} ${JSON.stringify(c.text)} (${c.reason})`);
      return result(
        "--hu-numbers",
        "numbers and dates stored as numbers",
        cells.length ? `${cells.length} text cell(s) that look like Hungarian numbers/dates: ${shown.join("; ")}${cells.length > 12 ? `; +${cells.length - 12} more` : ""}` : "none stored as text",
        cells.length === 0
      );
    }
  }
}
function makePdfBin(deps) {
  let bin;
  return () => bin ??= deps.provisionPdfcraft().then(
    (r) => r.binary,
    () => {
      throw new ToolMissing("pdfcraft");
    }
  );
}
async function runVerify(argv, partial = {}) {
  const deps = { ...defaultVerifyDeps(), ...partial };
  let parsed;
  try {
    parsed = parseVerifyArgs(argv);
  } catch (e) {
    deps.stderr(`aiplus-office verify: ${e.message}
${VERIFY_USAGE}
`);
    return 2;
  }
  if ("help" in parsed) {
    deps.stderr(`${VERIFY_USAGE}
`);
    return 0;
  }
  const { file, assertions, json } = parsed;
  const report = { file, ok: false, assertions: [] };
  const finish = (code) => {
    if (json) deps.stdout(`${JSON.stringify(report)}
`);
    else {
      if (report.error) deps.stdout(`${report.error}
`);
      for (const r of report.assertions) deps.stdout(`${r.pass ? "PASS" : "FAIL"} ${r.assertion}  expected ${r.expected}  actual ${r.actual}
`);
      if (report.missingTool) deps.stdout(`MISSING tool: ${report.missingTool}
`);
      deps.stdout(`${report.ok ? "OK" : "FAILED"}: ${file}
`);
    }
    return code;
  };
  if (!deps.exists(file)) {
    report.error = `file not found or unreadable: ${file}`;
    return finish(1);
  }
  for (const a of assertions) {
    if (a.kind === "frame-diff" && !deps.exists(a.ref)) {
      report.error = `--frame-diff reference not found or unreadable: ${a.ref}`;
      return finish(1);
    }
    if (a.kind === "hu-glyphs" && !deps.exists(a.source)) {
      report.error = `--hu-glyphs source not found or unreadable: ${a.source}`;
      return finish(1);
    }
  }
  const prober = makeProber(deps, file);
  const pdfBin = makePdfBin(deps);
  try {
    for (const a of assertions) report.assertions.push(await evaluate(a, file, deps, prober, pdfBin));
  } catch (e) {
    if (e instanceof ToolMissing) {
      report.missingTool = e.tool;
      report.error = `${e.message} \u2014 install it (ffmpeg provides ffprobe) or set the matching *_BIN override`;
      return finish(3);
    }
    report.error = e instanceof ProbeTimeout ? `probe timed out: ${e.message}` : `probe failed: ${e.message}`;
    return finish(1);
  }
  report.ok = report.assertions.every((r) => r.pass);
  return finish(report.ok ? 0 : 1);
}

// src/bin/aiplus-office.ts
var VERSION = "0.1.21";
var NODE_MIN_MAJOR = 20;
function nodeLine(version) {
  const major = Number(/^v?(\d+)/.exec(version)?.[1]);
  const ok = Number.isFinite(major) && major >= NODE_MIN_MAJOR;
  return `node: ${version} (${ok ? "ok" : "too old"}: needs ${NODE_MIN_MAJOR} or newer)`;
}
function usage() {
  return `usage: aiplus-office <command> [args]

commands:
  apps [--json]                list the office apps (offline)
  status [--json]              Node.js version, host, installed versions, cache size (never downloads)
  install <app\u2026>|--all         provision <app>-cli for each app, print one JSON report per app
  verify <file> [assertions\u2026]  mechanical output checks (aiplus-office verify --help)
  doc prepare <in.md> --out <dir>  fill a docx template, inline images/diagrams (aiplus-office doc --help)
  <app> ensure                 provision <app>-cli and print a JSON report
  <app> path                   provision <app>-cli and print its absolute path
  <app> exec <args\u2026>           run <app>-cli with <args\u2026> verbatim (bash route)
  <app> mcp [--root <dir>]     stdio MCP server (confined apps), --allow-unconfined otherwise
  <app> mcp --register         add an aiplus-office-<app> entry to ./.mcp.json (opt-in)
  jq <args\u2026>                   run a pinned jq ${JQ_VERSION} (downloaded once, checked), for systems without jq
  dict hu                      download the Hungarian spelling dictionary for WordCraft (about 4 MB, checked)
  --version                    print the aiplus-office version

apps: ${APP_IDS.join(", ")}

env: AIPLUS_OFFICE_HOME (cache root) \xB7 AIPLUS_OFFICE_<APP>_VERSION (pin) \xB7 AIPLUS_OFFICE_<APP>_BIN (skip provisioning)
     AIPLUS_OFFICE_TEMPLATES_DIR (doc prepare) \xB7 GITHUB_TOKEN (API rate limit)
exit: 0 ok \xB7 1 usage/failed \xB7 69 provisioning failure`;
}
function defaultCliDeps() {
  const d = defaultDeps();
  return {
    provision: (appId, opts) => provision(appId, opts),
    stdout: (t) => process.stdout.write(t),
    stderr: (t) => process.stderr.write(t),
    env: process.env,
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    homedir: d.homedir,
    now: d.now,
    runVerify: (argv) => runVerify(argv, {}),
    runDocPrepare: (argv, io) => prepareDoc(argv, io),
    runJq: async (argv) => {
      let bin;
      try {
        bin = await ensureJq(d);
      } catch (e) {
        process.stderr.write(`aiplus-office: jq: ${e.message}
`);
        return 69;
      }
      return execPassthrough("aiplus-office", bin, argv);
    },
    ensureHu: () => ensureHu(d)
  };
}
function formatBytes(n) {
  if (n === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
function appsCommand(rest, deps) {
  const json = rest.includes("--json");
  if (rest.some((a) => a !== "--json")) {
    deps.stderr(`usage: aiplus-office apps [--json]
`);
    return 1;
  }
  const rows = CRAFT_APPS.map((a) => ({ id: a.id, name: a.name, purpose: a.purpose, repo: repoFor(a, deps.platform, deps.arch), mcp: { confinement: a.mcp.confinement, toolClass: a.mcp.toolClass, tools: a.mcp.tools } }));
  if (json) deps.stdout(`${JSON.stringify(rows)}
`);
  else {
    for (const r of rows) {
      deps.stdout(`${r.id.padEnd(12)} ${r.purpose}
`);
      deps.stdout(`${"".padEnd(12)} ${r.repo} \xB7 mcp: ${r.mcp.confinement ? "confined" : "unconfined"}, ${r.mcp.tools} tools (${r.mcp.toolClass})
`);
    }
  }
  return 0;
}
function statusCommand(rest, deps) {
  const json = rest.includes("--json");
  if (rest.some((a) => a !== "--json")) {
    deps.stderr(`usage: aiplus-office status [--json]
`);
    return 1;
  }
  let rows;
  try {
    rows = CRAFT_APPS.map((a) => appStatus(a, deps));
  } catch (e) {
    deps.stderr(`aiplus-office: ${e.message}
`);
    return 1;
  }
  if (json) {
    deps.stdout(`${JSON.stringify(rows)}
`);
    return 0;
  }
  deps.stdout(`${nodeLine(deps.nodeVersion)}
`);
  deps.stdout(`host: ${deps.platform}/${deps.arch}
`);
  deps.stdout(`cache: ${statusRoot(deps)}
`);
  for (const d of desktopCacheRoots(deps)) deps.stdout(`desktop cache: ${d} (Claude Desktop's own copy; open this folder)
`);
  const dict = huDesktopDir(desktopCacheRoots(deps)) ?? (huInstalled(deps) ? dictionaryDir(deps) : void 0);
  deps.stdout(`dictionary: ${dict ? `hu_HU in ${dict}` : "hu_HU not installed (aiplus-office dict hu)"}
`);
  deps.stdout(`jq: ${installedJq(deps) ? `${JQ_VERSION} in the cache (aiplus-office jq)` : `not in the cache (the skills use a jq on PATH, else aiplus-office jq downloads ${JQ_VERSION}, about 1 MB)`}
`);
  for (const r of rows) {
    const inst = r.installed.length ? `${r.installed.join(", ")} (${formatBytes(r.cacheBytes)})` : "not installed";
    const use = r.wouldUse.version ? `${r.wouldUse.version} (${r.wouldUse.source})` : r.wouldUse.source;
    deps.stdout(`${r.app.padEnd(12)} ${inst} \xB7 next: ${use}${r.override ? ` \xB7 override: ${r.override}` : ""}
`);
  }
  return 0;
}
async function installCommand(rest, deps) {
  const all = rest.includes("--all");
  const ids = rest.filter((a) => a !== "--all");
  if (all && ids.length > 0 || !all && ids.length === 0) {
    deps.stderr(`usage: aiplus-office install <app\u2026> | aiplus-office install --all
`);
    return 1;
  }
  const bad = ids.filter((id) => !isAppId(id));
  if (bad.length) {
    deps.stderr(`aiplus-office: unknown craft app "${bad[0]}"; supported apps: ${APP_IDS.join(", ")}
`);
    return 1;
  }
  let failed = false;
  for (const id of all ? [...APP_IDS] : ids) {
    try {
      deps.stdout(`${JSON.stringify(await deps.provision(id, { probeVersion: true }))}
`);
    } catch (e) {
      failed = true;
      deps.stderr(`aiplus-office: ${id}: ${e.message}
`);
    }
  }
  return failed ? 69 : 0;
}
async function dictCommand(rest, deps) {
  if (rest.length !== 1 || rest[0] !== "hu") {
    deps.stderr(`usage: aiplus-office dict hu
`);
    return 1;
  }
  try {
    const dir = await deps.ensureHu();
    deps.stdout(`${huDesktopDir(desktopCacheRoots(deps)) ?? dir}
`);
    return 0;
  } catch (e) {
    deps.stderr(`aiplus-office: dict hu: ${e.message}
`);
    return 69;
  }
}
async function docCommand(rest, deps) {
  const [sub, ...more] = rest;
  if (sub === "--help" || sub === "-h") {
    deps.stderr(`${DOC_USAGE}
`);
    return 0;
  }
  if (sub === "prepare") return deps.runDocPrepare(more, { stdout: deps.stdout, stderr: deps.stderr });
  deps.stderr(`${DOC_USAGE}
`);
  return 1;
}
async function main(argv, partial = {}) {
  const deps = { ...defaultCliDeps(), ...partial };
  const [command, ...rest] = argv;
  switch (command) {
    case "apps":
      return appsCommand(rest, deps);
    case "status":
      return statusCommand(rest, deps);
    case "install":
      return installCommand(rest, deps);
    case "verify":
      return deps.runVerify(rest);
    case "doc":
      return docCommand(rest, deps);
    case "jq":
      return deps.runJq(rest);
    case "dict":
      return dictCommand(rest, deps);
    case "--version":
    case "-V":
      deps.stdout(`aiplus-office ${VERSION}
`);
      return 0;
    case "--help":
    case "-h":
      deps.stderr(`${usage()}
`);
      return 0;
    default: {
      if (command && isAppId(command)) {
        const app2 = getApp(command);
        const [sub, ...args] = rest;
        if (app2.id === "wordcraft") {
          const dir = wordcraftEnv(deps.env, deps).WORDCRAFT_DICTIONARIES;
          if (dir && !deps.env.WORDCRAFT_DICTIONARIES) deps.env.WORDCRAFT_DICTIONARIES = dir;
        }
        const code = await runAppCommand(app2, sub ?? "", args, {
          prog: "aiplus-office",
          provision: (opts) => deps.provision(command, opts),
          stdout: deps.stdout,
          stderr: deps.stderr,
          usage: usage(),
          version: VERSION,
          register: { launcher: defaultLauncherPath(), entryArgs: [app2.id, "mcp"] }
        });
        if (code !== void 0) return code;
      }
      deps.stderr(`${usage()}
`);
      return 1;
    }
  }
}
function isEntry() {
  try {
    const entry = process.argv[1];
    return !!entry && fs11.realpathSync(entry) === fs11.realpathSync(fileURLToPath3(import.meta.url));
  } catch {
    return false;
  }
}
if (isEntry()) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => {
      process.stderr.write(`aiplus-office: ${e.message}
`);
      process.exit(1);
    }
  );
}
export {
  NODE_MIN_MAJOR,
  VERSION,
  main,
  nodeLine,
  usage
};
