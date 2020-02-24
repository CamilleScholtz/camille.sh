// Style scrollbar.
let scroll = () => {
	OverlayScrollbars(document.querySelector("main"), {});
}

// Update window title.
let title = () => {
	let path = window.location.pathname.split("/").pop();
	if (path == "") {
		return;
	}

	document.title = "camille.sh / " + path;
}

// Expand active nav sub items.
let active = (nav) => {
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
	let children = active.closest(".items-container").querySelectorAll(
		".sub-items .item");

	// Expand active nav sub items.
	children.forEach((el) => el.classList.add("open"));
}

// Expand nav sub items on proximity.
let proximity = (nav) => {
	let items = nav.querySelector("#items");

	nav.querySelectorAll(".items-container").forEach((el) => {
		let children = el.querySelectorAll(".sub-items .item");
		if (children.length == 0) {
			return;
		}

		// TODO: Possibly make the selector `el`.
		new Nearby(items, {
			onProgress: (dist) => {
				const h = Nearby.lineEq(0, 64, 150, 0, dist);
				const o = Nearby.lineEq(0, 1, 130, 0, dist);

				children.forEach((el) => {
					gsap.to(el, {
						duration: .8,
						ease:     "expo.out",
						maxHeight: Math.max(h, 0),
						opacity:   Math.max(o, 0),
					});
				})
		    }
		});
	});
}

// Expand nav on click.
let toggle = (nav) => {
	let toggle   = nav.querySelector("#toggle");
	let items    = nav.querySelector("#items");
	let children = nav.querySelectorAll(".sub-items .item");

	toggle.addEventListener("click", (ev) => {
		if (toggle.classList.contains("open")) {
			toggle.classList.remove("open");

			gsap.to(items, {
				duration: .3,
				ease:     "expo.inOut",
				height:   80,
				opacity:  0.5,
				width:    80,
			});
		} else {
			toggle.classList.add("open");
			children.forEach((el) => el.classList.add("open"));

			gsap.to(items, {
				duration: .3,
				ease:     "expo.inOut",
				height:   "calc(100vh - 40px)",
				opacity:  1,
				width:    "calc(100vw - 40px)",
			});
		}
	});
}

window.addEventListener("DOMContentLoaded", (ev) => {
	let nav = document.querySelector("nav");

	scroll();
	title();
	active(nav);
	proximity(nav);
	toggle(nav);
});
