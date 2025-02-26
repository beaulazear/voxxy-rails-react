import { canvasEventWithTime } from '@rrweb/types';
import { canvasMutationData } from '@rrweb/types';
import { IMirror } from '@rrweb/types';
import { inputData } from '@rrweb/types';
import { Mirror as Mirror_2 } from 'rrweb-snapshot';
import { NodeType as NodeType_2 } from '@rrweb/types';
import { scrollData } from '@rrweb/types';
import { serializedNodeWithId } from '@rrweb/types';
import { styleDeclarationData } from '@rrweb/types';
import { styleSheetRuleData } from '@rrweb/types';

export declare class BaseRRCDATASection extends BaseRRNode implements IRRCDATASection {
    readonly nodeName: "#cdata-section";
    readonly nodeType: number;
    readonly RRNodeType = RRNodeType.CDATA;
    data: string;
    constructor(data: string);
    get textContent(): string;
    set textContent(textContent: string);
    toString(): string;
}

export declare class BaseRRComment extends BaseRRNode implements IRRComment {
    readonly nodeType: number;
    readonly nodeName: "#comment";
    readonly RRNodeType = RRNodeType.Comment;
    data: string;
    constructor(data: string);
    get textContent(): string;
    set textContent(textContent: string);
    toString(): string;
}

export declare class BaseRRDialogElement extends BaseRRElement {
    readonly tagName: "DIALOG";
    readonly nodeName: "DIALOG";
    get isModal(): boolean;
    get open(): boolean;
    close(): void;
    show(): void;
    showModal(): void;
}

export declare class BaseRRDocument extends BaseRRNode implements IRRDocument {
    readonly nodeType: number;
    readonly nodeName: "#document";
    readonly compatMode: 'BackCompat' | 'CSS1Compat';
    readonly RRNodeType = RRNodeType.Document;
    textContent: string | null;
    constructor(...args: any[]);
    get documentElement(): IRRElement | null;
    get body(): IRRElement | null;
    get head(): IRRElement | null;
    get implementation(): IRRDocument;
    get firstElementChild(): IRRElement | null;
    appendChild(newChild: IRRNode): IRRNode;
    insertBefore(newChild: IRRNode, refChild: IRRNode | null): IRRNode;
    removeChild(node: IRRNode): IRRNode;
    open(): void;
    close(): void;
    write(content: string): void;
    createDocument(_namespace: string | null, _qualifiedName: string | null, _doctype?: DocumentType | null): IRRDocument;
    createDocumentType(qualifiedName: string, publicId: string, systemId: string): IRRDocumentType;
    createElement(tagName: string): IRRElement;
    createElementNS(_namespaceURI: string, qualifiedName: string): IRRElement;
    createTextNode(data: string): IRRText;
    createComment(data: string): IRRComment;
    createCDATASection(data: string): IRRCDATASection;
    toString(): string;
}

export declare class BaseRRDocumentType extends BaseRRNode implements IRRDocumentType {
    readonly nodeType: number;
    readonly RRNodeType = RRNodeType.DocumentType;
    readonly nodeName: string;
    readonly name: string;
    readonly publicId: string;
    readonly systemId: string;
    textContent: string | null;
    constructor(qualifiedName: string, publicId: string, systemId: string);
    toString(): string;
}

export declare class BaseRRElement extends BaseRRNode implements IRRElement {
    readonly nodeType: number;
    readonly RRNodeType = RRNodeType.Element;
    readonly nodeName: string;
    tagName: string;
    attributes: Record<string, string>;
    shadowRoot: IRRElement | null;
    scrollLeft?: number;
    scrollTop?: number;
    constructor(tagName: string);
    get textContent(): string;
    set textContent(textContent: string);
    get classList(): ClassList;
    get id(): string;
    get className(): string;
    get style(): CSSStyleDeclaration_2;
    getAttribute(name: string): string | null;
    setAttribute(name: string, attribute: string): void;
    setAttributeNS(_namespace: string | null, qualifiedName: string, value: string): void;
    removeAttribute(name: string): void;
    appendChild(newChild: IRRNode): IRRNode;
    insertBefore(newChild: IRRNode, refChild: IRRNode | null): IRRNode;
    removeChild(node: IRRNode): IRRNode;
    attachShadow(_init: ShadowRootInit): IRRElement;
    dispatchEvent(_event: Event): boolean;
    toString(): string;
}

export declare class BaseRRMediaElement extends BaseRRElement {
    currentTime?: number;
    volume?: number;
    paused?: boolean;
    muted?: boolean;
    playbackRate?: number;
    loop?: boolean;
    attachShadow(_init: ShadowRootInit): IRRElement;
    play(): void;
    pause(): void;
}

declare abstract class BaseRRNode implements IRRNode {
    parentElement: IRRNode | null;
    parentNode: IRRNode | null;
    ownerDocument: IRRDocument;
    firstChild: IRRNode | null;
    lastChild: IRRNode | null;
    previousSibling: IRRNode | null;
    nextSibling: IRRNode | null;
    abstract textContent: string | null;
    readonly ELEMENT_NODE: number;
    readonly TEXT_NODE: number;
    readonly nodeType: number;
    readonly nodeName: string;
    readonly RRNodeType: NodeType_2;
    constructor(..._args: any[]);
    get childNodes(): IRRNode[];
    contains(node: IRRNode): boolean;
    appendChild(_newChild: IRRNode): IRRNode;
    insertBefore(_newChild: IRRNode, _refChild: IRRNode | null): IRRNode;
    removeChild(_node: IRRNode): IRRNode;
    toString(): string;
}
export { BaseRRNode }
export { BaseRRNode as RRNode }

export declare class BaseRRText extends BaseRRNode implements IRRText {
    readonly nodeType: number;
    readonly nodeName: "#text";
    readonly RRNodeType = RRNodeType.Text;
    data: string;
    constructor(data: string);
    get textContent(): string;
    set textContent(textContent: string);
    toString(): string;
}

export declare function buildFromDom(dom: Document, domMirror?: Mirror_2, rrdom?: IRRDocument): IRRDocument;

export declare function buildFromNode(node: Node, rrdom: IRRDocument, domMirror: Mirror_2, parentRRNode?: IRRNode | null): IRRNode | null;

export declare class ClassList {
    private onChange;
    classes: string[];
    constructor(classText?: string, onChange?: ((newClassText: string) => void) | undefined);
    add: (...classNames: string[]) => void;
    remove: (...classNames: string[]) => void;
}

export declare function createMirror(): Mirror;

export declare function createOrGetNode(rrNode: IRRNode, domMirror: Mirror_2, rrnodeMirror: Mirror): Node;

declare type CSSStyleDeclaration_2 = Record<string, string> & {
    setProperty: (name: string, value: string | null, priority?: string | null) => void;
    removeProperty: (name: string) => string;
};
export { CSSStyleDeclaration_2 as CSSStyleDeclaration }

export declare function diff(oldTree: Node, newTree: IRRNode, replayer: ReplayerHandler, rrnodeMirror?: Mirror): void;

export declare function getDefaultSN(node: IRRNode, id: number): serializedNodeWithId;

export declare interface IRRCDATASection extends IRRNode {
    readonly nodeName: '#cdata-section';
    data: string;
}

export declare interface IRRComment extends IRRNode {
    readonly nodeName: '#comment';
    data: string;
}

export declare interface IRRDocument extends IRRNode {
    documentElement: IRRElement | null;
    body: IRRElement | null;
    head: IRRElement | null;
    implementation: IRRDocument;
    firstElementChild: IRRElement | null;
    readonly nodeName: '#document';
    compatMode: 'BackCompat' | 'CSS1Compat';
    createDocument(_namespace: string | null, _qualifiedName: string | null, _doctype?: DocumentType | null): IRRDocument;
    createDocumentType(qualifiedName: string, publicId: string, systemId: string): IRRDocumentType;
    createElement(tagName: string): IRRElement;
    createElementNS(_namespaceURI: string, qualifiedName: string): IRRElement;
    createTextNode(data: string): IRRText;
    createComment(data: string): IRRComment;
    createCDATASection(data: string): IRRCDATASection;
    open(): void;
    close(): void;
    write(content: string): void;
}

export declare interface IRRDocumentType extends IRRNode {
    readonly name: string;
    readonly publicId: string;
    readonly systemId: string;
}

export declare interface IRRElement extends IRRNode {
    tagName: string;
    attributes: Record<string, string>;
    shadowRoot: IRRElement | null;
    scrollLeft?: number;
    scrollTop?: number;
    id: string;
    className: string;
    classList: ClassList;
    style: CSSStyleDeclaration_2;
    attachShadow(init: ShadowRootInit): IRRElement;
    getAttribute(name: string): string | null;
    setAttribute(name: string, attribute: string): void;
    setAttributeNS(namespace: string | null, qualifiedName: string, value: string): void;
    removeAttribute(name: string): void;
    dispatchEvent(event: Event): boolean;
}

export declare interface IRRNode {
    parentElement: IRRNode | null;
    parentNode: IRRNode | null;
    ownerDocument: IRRDocument;
    readonly childNodes: IRRNode[];
    readonly ELEMENT_NODE: number;
    readonly TEXT_NODE: number;
    readonly nodeType: number;
    readonly nodeName: string;
    readonly RRNodeType: NodeType_2;
    firstChild: IRRNode | null;
    lastChild: IRRNode | null;
    previousSibling: IRRNode | null;
    nextSibling: IRRNode | null;
    textContent: string | null;
    contains(node: IRRNode): boolean;
    appendChild(newChild: IRRNode): IRRNode;
    insertBefore(newChild: IRRNode, refChild: IRRNode | null): IRRNode;
    removeChild(node: IRRNode): IRRNode;
    toString(): string;
}

export declare interface IRRText extends IRRNode {
    readonly nodeName: '#text';
    data: string;
}

export declare class Mirror implements IMirror<BaseRRNode> {
    private idNodeMap;
    private nodeMetaMap;
    getId(n: BaseRRNode | undefined | null): number;
    getNode(id: number): BaseRRNode | null;
    getIds(): number[];
    getMeta(n: BaseRRNode): serializedNodeWithId | null;
    removeNodeFromMap(n: BaseRRNode): void;
    has(id: number): boolean;
    hasNode(node: BaseRRNode): boolean;
    add(n: BaseRRNode, meta: serializedNodeWithId): void;
    replace(id: number, n: BaseRRNode): void;
    reset(): void;
}

export declare enum NodeType {
    PLACEHOLDER = 0,
    ELEMENT_NODE = 1,
    ATTRIBUTE_NODE = 2,
    TEXT_NODE = 3,
    CDATA_SECTION_NODE = 4,
    ENTITY_REFERENCE_NODE = 5,
    ENTITY_NODE = 6,
    PROCESSING_INSTRUCTION_NODE = 7,
    COMMENT_NODE = 8,
    DOCUMENT_NODE = 9,
    DOCUMENT_TYPE_NODE = 10,
    DOCUMENT_FRAGMENT_NODE = 11
}

export declare function printRRDom(rootNode: IRRNode, mirror: IMirror<IRRNode>): string;

export declare type ReplayerHandler = {
    mirror: Mirror_2;
    applyCanvas: (canvasEvent: canvasEventWithTime, canvasMutationData: canvasMutationData, target: HTMLCanvasElement) => void;
    applyInput: (data: inputData) => void;
    applyScroll: (data: scrollData, isSync: boolean) => void;
    applyStyleSheetMutation: (data: styleDeclarationData | styleSheetRuleData, styleSheet: CSSStyleSheet) => void;
    afterAppend?(node: Node, id: number): void;
};

export declare class RRCanvasElement extends RRElement implements IRRElement {
    rr_dataURL: string | null;
    canvasMutations: {
        event: canvasEventWithTime;
        mutation: canvasMutationData;
    }[];
    getContext(): RenderingContext | null;
}

export declare const RRCDATASection: typeof BaseRRCDATASection;

export declare type RRCDATASection = typeof RRCDATASection;

export declare const RRComment: typeof BaseRRComment;

export declare type RRComment = typeof RRComment;

export declare class RRDialogElement extends BaseRRDialogElement {
}

export declare class RRDocument extends BaseRRDocument {
    private UNSERIALIZED_STARTING_ID;
    private _unserializedId;
    get unserializedId(): number;
    mirror: Mirror;
    scrollData: scrollData | null;
    constructor(mirror?: Mirror);
    createDocument(_namespace: string | null, _qualifiedName: string | null, _doctype?: DocumentType | null): RRDocument;
    createDocumentType(qualifiedName: string, publicId: string, systemId: string): BaseRRDocumentType;
    createElement<K extends keyof HTMLElementTagNameMap>(tagName: K): RRElementType<K>;
    createElement(tagName: string): RRElement;
    createComment(data: string): BaseRRComment;
    createCDATASection(data: string): BaseRRCDATASection;
    createTextNode(data: string): BaseRRText;
    destroyTree(): void;
    open(): void;
}

export declare const RRDocumentType: typeof BaseRRDocumentType;

export declare class RRElement extends BaseRRElement {
    inputData: inputData | null;
    scrollData: scrollData | null;
}

declare interface RRElementTagNameMap {
    audio: RRMediaElement;
    canvas: RRCanvasElement;
    iframe: RRIFrameElement;
    style: RRStyleElement;
    video: RRMediaElement;
}

declare type RRElementType<K extends keyof HTMLElementTagNameMap> = K extends keyof RRElementTagNameMap ? RRElementTagNameMap[K] : RRElement;

export declare class RRIFrameElement extends RRElement {
    contentDocument: RRDocument;
    constructor(upperTagName: string, mirror: Mirror);
}

export declare class RRMediaElement extends BaseRRMediaElement {
}

export declare class RRStyleElement extends RRElement {
    rules: (styleSheetRuleData | styleDeclarationData)[];
}

export declare const RRText: typeof BaseRRText;

export declare type RRText = typeof RRText;

export { }
