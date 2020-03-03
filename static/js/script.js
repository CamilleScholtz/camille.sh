// Style scrollbar.
const scroll = (main) => {
	let scale    = 0;
	let ticking  = false;
	const blocks = main.querySelectorAll(".block");
	const title  = main.querySelector("h1");

	OverlayScrollbars(main, {
		callbacks: {
			onScroll: (ev) => {
				pos = ev.target.scrollTop;
				if (pos > 400) {
					return;
				}
			
				if (ticking) {
					return;
				}

				window.requestAnimationFrame(() => {
					gsap.to(blocks, {
						duration:   2,
						ease:       "expo.out",
						stagger:    0.04,
						translateY: pos * 1.8,
					});

					gsap.to(title, {
						duration:   1.3,
						ease:       "expo.out",
						translateY: pos * 3,
					});

					ticking = false;
				});

				ticking = true;
			},
		},
	});
}

// Update window title.
const title = (main) => {
	const title = main.querySelector("h1");
	if (!title) {
		return;
	}

	document.title = "camille.sh" + title.innerText;
}

// Expand active nav sub items.
const active = (nav) => {
	// Find active nav link.
	let active = nav.querySelector(".item a[href='" + window.location.pathname +
		"']");
	if (active == null) {
		return;
	}
	active = active.closest(".item");

	// Set active nav link.
	active.classList.add("active");

	// find active nav link sub links.
	const children = active.closest(".items-container").querySelectorAll(
		".sub-items .item");

	// Expand active nav sub items.
	children.forEach((el) => el.classList.add("open"));
}

// Expand nav sub items on proximity.
const proximity = (nav) => {
	const items    = nav.querySelector("#items");
	const children = items.querySelectorAll(
		".items-container .sub-items .item");

	new Nearby(items, {
		onProgress: (dist) => {
			gsap.to(children, {
				duration:  0.8,
				ease:      "expo.out",
				stagger:   0.05,
				maxHeight: Math.max(Nearby.lineEq(0, 64, 150, 0, dist), 0),
				opacity:   Math.max(Nearby.lineEq(0, 1, 130, 0, dist), 0),
			});
		},
	});
}

// Expand nav on click.
const toggle = (nav) => {
	const toggle   = nav.querySelector("#toggle");
	const items    = nav.querySelector("#items");
	const children = nav.querySelectorAll(".sub-items .item");

	toggle.addEventListener("click", (ev) => {
		if (toggle.classList.contains("open")) {
			toggle.classList.remove("open");

			gsap.to(items, {
				duration: 0.3,
				ease:     "expo.inOut",
				height:   80,
				opacity:  0.5,
				width:    80,
			});
		} else {
			toggle.classList.add("open");
			children.forEach((el) => el.classList.add("open"));

			gsap.to(items, {
				duration: 0.3,
				ease:     "expo.inOut",
				height:   "calc(100vh - 40px)",
				opacity:  1,
				width:    "calc(100vw - 40px)",
			});
		}
	});
}

// Style upload input.
const upload = (main) => {
	const container = main.querySelector("#upload-container");
	if (!container) {
		return;
	}
	const input = container.querySelector("input");
	const label = container.querySelector("span");

	container.addEventListener("dragover", (ev) => {
		ev.preventDefault();
	});

	container.addEventListener("drop", (ev) => {
		ev.preventDefault();
		
		input.files = ev.dataTransfer.files;
		input.dispatchEvent(new Event("change"));
	});

	input.addEventListener("change", (ev) => {
		let file = "";
		if (input.files.length > 1) {
			file = input.files.length + " files selected";
		} else {
			file = input.files[0].name;
		}

		if (file) {
			label.innerHTML = file;
		} else {
			label.innerHTML = label.innerHTML;
		}
	});
}

window.addEventListener("DOMContentLoaded", (ev) => {
	const nav  = document.querySelector("nav");
	const main = document.querySelector("main")

	scroll(main);
	title(main);
	active(nav);
	proximity(nav);
	toggle(nav);
	upload(main);
});
