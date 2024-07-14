class Observable {
	observers = [];

	subscribe(s) {
		this.observers.push(s);
	}

	unsubscribe(f) {
		this.observers = this.observers.filter((subscriber) =>
			subscriber !== f
		);
	}

	notify(data) {
		this.observers.forEach((observer) => observer(data));
	}
}

class I3Block extends HTMLElement {
	/*
	# align
	# color
	# command
	# full_text
	# instance
	# interval
	# label
	# min_width
	# name
	# separator
	# separator_block_width
	# short_text
	# signal
	# urgent
	*/
	label = "Label ";
	color = "#fff";
	commandMock = "";
	show = "";

	constructor({ label, color, commandMock, id } = {}) {
		super();

		this.id = id;
		this.label = label || this.label;
		this.color = color || this.color;
		this.commandMock = commandMock || this.commandMock;

		this.show = `${this.label}${this.commandMock}`;
	}

	connectedCallback() {
		const stylesheet = new CSSStyleSheet();
		const shadow = this.attachShadow({ mode: "open" });

		stylesheet.replaceSync(`
			div {
				padding: 1px;
				color: ${this.color};
			}
		`);

		shadow.adoptedStyleSheets = [stylesheet];
		shadow.innerHTML = `<div>${this.show}</div>`;
	}

	setColor(color) {
		this.shadowRoot.firstChild.style.color = color;
	}

	setLabel(el) {
		this.shadowRoot.innerHTML = `<div>${el}</div>`;
	}
}

class I3BlocksRepository {
	repo = null;
	#__blocks = [
		new I3Block({
			label: "",
			commandMock: (() => {
				const d = new Date();
				return `${d.getFullYear()}-${
					d.getMonth() + 1
				}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
			})(),
		}),
	];

	observer = new Observable();

	static getInstance() {
		if (!this.repo) {
			this.repo = new I3BlocksRepository();
		}

		return this.repo;
	}

	getBlocks() {
		return this.#__blocks.map((b, id) => {
			const block = new I3Block({
				id,
				label: `${b.label || ""}${b.commandMock || ""}`,
				color: b.color,
			});

			return block;
		});
	}

	addBlock() {
		const block = new I3Block({ id: this.#__blocks.length });

		this.#__blocks.push(block);

		this.observer.notify({ event: "block:added", data: block });
	}

	removeBlock(block) {
		const id = block.getElementsByTagName("it-block")[0].getAttribute("id");
		this.#__blocks.splice(id, 1);

		this.observer.notify({ event: "block:removed", data: block });
	}
}

class WorkspaceButton extends HTMLElement {
	setBackgroundColor(color) {
		this.shadowRoot.firstChild.style.background = color;
	}

	setBorderColor(color) {
		this.shadowRoot.firstChild.style["border-color"] = color;
	}

	setFontColor(color) {
		this.shadowRoot.firstChild.style.color = color;
	}

	connectedCallback() {
		const stylesheet = new CSSStyleSheet();
		const shadow = this.attachShadow({ mode: "open" });

		stylesheet.replaceSync(`
			div {
			    background: #222;
				color: #888;
				border: 1px solid #333;
				padding-left: 4px;
				padding-right: 4px;
				padding-top: 3px;
				padding-bottom: 3px;
			}
		`);

		if ("focused" in this.attributes) {
			stylesheet.insertRule(
				`
					div { 
						color: #fff;
						background: #285577;
						border-color: #4c7899;
					}
				`,
				stylesheet.cssRules.length,
			);

			this.shadowRoot.host.classList.add("focused");
		} else if ("active" in this.attributes) {
			stylesheet.insertRule(
				`
					div { 
						background: #5f676a;
						border-color: #333;
						color: #fff;
					}
				`,
				stylesheet.cssRules.length,
			);
			this.shadowRoot.host.classList.add("active");
		} else {
			stylesheet.insertRule(
				`
					div { 
						background: #222;
						border-color: #333;
						color: #888;
					}
				`,
				stylesheet.cssRules.length,
			);
			this.shadowRoot.host.classList.add("inactive");
		}

		shadow.adoptedStyleSheets = [stylesheet];
		shadow.innerHTML = `<div><slot></slot></div>`;
	}
}

class WorkspaceList extends HTMLElement {
	connectedCallback() {
		const stylesheet = new CSSStyleSheet();
		const shadow = this.attachShadow({ mode: "open" });

		stylesheet.replaceSync(`
			div {
			  	display: flex;
				height: fit-content;
				width: fit-content;
				gap: 1px;
			}
		`);

		shadow.adoptedStyleSheets = [stylesheet];
		shadow.innerHTML = `<div><slot></slot></div>`;
	}
}

class I3Bar extends HTMLElement {
	connectedCallback() {
		const stylesheet = new CSSStyleSheet();
		const shadow = this.attachShadow({ mode: "open" });

		stylesheet.replaceSync(`
			div {
			  	display: flex;
				position: fixed;
				color: white;
				background-color: black;
				font-size: 10px;
				font-family: Pango, monospace;
				width: 100%;
				height: fit-content;
				justify-content: space-between;
				align-items: center;
			}
		`);

		shadow.adoptedStyleSheets = [stylesheet];
		shadow.innerHTML = `<div><slot></slot></div>`;
	}

	setBackgroundColor(color) {
		this.shadowRoot.firstChild.style.background = color;
	}

	setStatuslineColor(color) {
		this.shadowRoot.firstChild.style.color = color;
	}

	setBorderColor(color) {
		this.shadowRoot.firstChild.style["border-color"] = color;
	}

	setSeparatorColor(color) {
		const separators = this.getElementsByTagName("it-block-separator");

		for (const separator of separators) {
			separator.setColor(color);
		}
	}
}

class I3BlockSeparator extends HTMLElement {
	connectedCallback() {
		const stylesheet = new CSSStyleSheet();
		const shadow = this.attachShadow({ mode: "open" });

		stylesheet.replaceSync(`
			div {
				margin-left: 4.5px;
				margin-right: 4.5px;
				margin-top: 2px;
				margin-bottom: 2px;
			}
		`);

		shadow.adoptedStyleSheets = [stylesheet];
		shadow.innerHTML = `<div><slot></slot></div>`;
	}

	setColor(color) {
		this.shadowRoot.firstChild.style.color = color;
	}
}

class I3BlocksList extends HTMLElement {
	repo = I3BlocksRepository.getInstance();

	handleRepoUpdated() {
		this.render();
	}

	constructor() {
		super();
		const stylesheet = new CSSStyleSheet();
		stylesheet.replaceSync(`
			div {
				display: flex;
				align-items: center;
			}
		`);

		const shadow = this.attachShadow({ mode: "open" });

		shadow.adoptedStyleSheets = [stylesheet];
		shadow.innerHTML = `<div><slot></slot></div>`;
		this.repo.observer.subscribe((data) => {
			this.handleRepoUpdated(data);
		});
	}

	render() {
		this.replaceChildren(...this.repo.getBlocks());
	}

	connectedCallback() {
		this.render();
	}
}

class I3BlocksListConfig extends HTMLElement {
	repo = I3BlocksRepository.getInstance();

	handleRepoUpdated() {
		this.render();
	}

	constructor() {
		super();

		const stylesheet = new CSSStyleSheet();
		const shadow = this.attachShadow({ mode: "open" });

		stylesheet.replaceSync(`
			div {
				display: flex;
				align-items: center;
				flex-direction: column;
				background-color: red;
			}
		`);

		shadow.adoptedStyleSheets = [stylesheet];
		shadow.innerHTML = `<div><slot></slot></div>`;
		this.repo.observer.subscribe((data) => {
			this.handleRepoUpdated(data);
		});
	}

	render() {
		const d = document.createElement("div");

		for (const block of this.repo.getBlocks()) {
			const item = document.createElement("div");
			const btnContainer = document.createElement("div");
			item.style.display = "flex";
			item.style["background-color"] = "red";
			item.style["justify-content"] = "space-between";
			const editBtn = document.createElement("button");
			editBtn.innerText = "edit";
			const deleteBtn = document.createElement("button");
			deleteBtn.innerText = "delete";

			deleteBtn.onclick = () => {
				this.repo.removeBlock(item);
			};

			item.appendChild(block);
			item.appendChild(btnContainer);
			btnContainer.appendChild(editBtn);
			btnContainer.appendChild(deleteBtn);

			d.appendChild(item);
		}

		this.replaceChildren(d);
	}

	connectedCallback() {
		this.render();
	}
}

function handleChangeBarColorProperty(prop, val) {
	const bars = document.getElementsByTagName("it-bar");

	if (prop === "background") {
		for (const bar of bars) {
			bar.setBackgroundColor(val);
		}
	} else if (prop === "status line") {
		for (const bar of bars) {
			bar.setStatuslineColor(val);
		}
	} else if (prop === "separator") {
		for (const bar of bars) {
			bar.setSeparatorColor(val);
		}
	}
}

function handleChangeWorkspaceButtonColorProperty(prop, val) {
	let workspaces = [];

	if (prop.includes("focused workspace")) {
		workspaces = document.getElementsByClassName("focused");
	} else if (prop.includes("inactive workspace")) {
		workspaces = document.getElementsByClassName("inactive");
	} else if (prop.includes("active workspace")) {
		workspaces = document.getElementsByClassName("active");
	}

	if (prop.includes("background")) {
		for (const ws of workspaces) {
			ws.setBackgroundColor(val);
		}
		return;
	} else if (prop.includes("border")) {
		for (const ws of workspaces) {
			ws.setBorderColor(val);
		}
		return;
	} else if (prop.includes("font")) {
		for (const ws of workspaces) {
			ws.setFontColor(val);
		}
		return;
	}
}

function handleAddBlock() {
	const repo = I3BlocksRepository.getInstance();
	repo.addBlock();
}

customElements.define("workspace-button", WorkspaceButton);
customElements.define("workspace-list", WorkspaceList);
customElements.define("it-bar", I3Bar);
customElements.define("it-block-separator", I3BlockSeparator);
customElements.define("it-block", I3Block);
customElements.define("it-blocks-list", I3BlocksList);
customElements.define("it-blocks-list-config", I3BlocksListConfig);