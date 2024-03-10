type Options =
{
	builds: {},
	
	transitionAnimationTime: number,
	transitionAnimationDistanceFactor: number,
	
	tableViewAnimationTime: number,
	shelfAnimationTime: number,
	
	slideAnimateInEasing: string,
	slideAnimateOutEasing: string,
	shelfAnimateInEasing: string,
	shelfAnimateOutEasing: string,
	tableViewEasing: string,
	
	appendHTML: string
	
	startingSlide: number,
	tableViewSlidesPerScreen: number,
	
	useShelf: boolean,
	useShelfIndicator: boolean,
	permanentShelf: boolean,
	shelfIconPaths: string | string[],
	
	resizeOnTableView: boolean,
	windowHeightAnimationFrames: number,
	
	dragDistanceThreshhold: number;
};

const defaultOptions: Options = {
	builds: {},
	
	transitionAnimationTime: 150,
	transitionAnimationDistanceFactor: .015,
	
	tableViewAnimationTime: 600,
	shelfAnimationTime: 275,
	
	slideAnimateInEasing: "cubic-bezier(.4, 1.0, .7, 1.0)",
	slideAnimateOutEasing: "cubic-bezier(.1, 0.0, .2, 0.0)",
	shelfAnimateInEasing: "cubic-bezier(.4, 1.0, .7, 1.0)",
	shelfAnimateOutEasing: "cubic-bezier(.4, 0.0, .4, 1.0)",
	tableViewEasing: "cubic-bezier(.25, 1.0, .5, 1.0)",
	
	appendHTML: "",
	
	startingSlide: 0,
	tableViewSlidesPerScreen: 4,
	
	useShelf: true,
	useShelfIndicator: true,
	permanentShelf: false,
	shelfIconPaths: "/icons/",
	
	resizeOnTableView: false,
	windowHeightAnimationFrames: 8,
	
	dragDistanceThreshhold: 10
};



class Lapsa
{
	callbacks = {};
	slideContainer: HTMLElement;
	slides: NodeListOf<HTMLElement>;
	currentSlide: number = -1;
	buildState = 0;
	tableViewSlidesPerScreen: number;
	
	useShelf: boolean;
	useShelfIndicator: boolean;
	permanentShelf: boolean;
	shelfIconPaths: string | string[];
	
	transitionAnimationTime: number;
	transitionAnimationDistanceFactor: number;
	
	tableViewAnimationTime: number;
	shelfAnimationTime: number;
	
	tableViewEasing: string;
	slideAnimateInEasing: string;
	slideAnimateOutEasing: string;
	shelfAnimateInEasing: string;
	shelfAnimateOutEasing: string;
	
	windowHeightAnimationFrames: number;
	resizeOnTableView: boolean;
	
	dragDistanceThreshhold: number;
	
	appendHTML: string;
	
	
	
	#rootSelector: HTMLElement;
	#bottomMarginElement: HTMLElement;
	
	#shelfContainer: HTMLElement;
	#slideShelf: HTMLElement;
	#shelfMargin = 15;
	#shelfIsOpen = false;
	#shelfIsAnimating = false;
	
	#shelfIndicatorContainer: HTMLElement;
	#slideShelfIndicator: HTMLElement;
	
	#transitionAnimationDistance = 0;
	
	#startingSlide = 0;
	#numBuilds = [];
	
	#currentlyAnimating = false;
	#inTableView = false;
	
	#boundFunctions = [null, null, null, null, null];
	#currentlyTouchDevice = false;
	#lastMousemoveEvent = 0;
	
	#lastWindowHeight = window.innerHeight;
	#startWindowHeight = window.innerHeight;
	#windowHeightAnimationFrame = 0;
	#windowHeightAnimationLastTimestamp = -1;
	#resizeAnimationBound;
	#missedResizeAnimation = false;
	
	#currentlyDragging = false;
	#dragDistanceX = 0;
	#lastTouchX = -1;
	#dragDistanceY = 0;
	#lastTouchY = -1;
	#lastMoveThisDrag = 0;

	#safeVh = window.innerHeight / 100;
	
	constructor(options: Partial<Options>)
	{
		options = {
			...defaultOptions,
			...options
		};
		
		this.callbacks = options.builds;
		
		this.transitionAnimationTime = options.transitionAnimationTime;
		this.transitionAnimationDistanceFactor = options.transitionAnimationDistanceFactor;
		
		this.tableViewAnimationTime = options.tableViewAnimationTime;
		this.shelfAnimationTime = options.shelfAnimationTime;
		
		this.resizeOnTableView = options.resizeOnTableView;
		this.windowHeightAnimationFrames = options.windowHeightAnimationFrames;
		
		this.#startingSlide = options.startingSlide;
		this.tableViewSlidesPerScreen = options.tableViewSlidesPerScreen;
		
		this.useShelf = options.useShelf;
		this.useShelfIndicator = options.useShelfIndicator;
		this.permanentShelf = options.permanentShelf;
		
		this.shelfIconPaths = options.shelfIconPaths;
		
		if (typeof this.shelfIconPaths === "string")
		{
			if (
				this.shelfIconPaths.length >= 1
				&& this.shelfIconPaths[this.shelfIconPaths.length - 1] !== "/"
			) {
				this.shelfIconPaths = `${this.shelfIconPaths}/`;
			}
			
			this.shelfIconPaths = [
				`${this.shelfIconPaths}up-2.png`,
				`${this.shelfIconPaths}up-1.png`,
				`${this.shelfIconPaths}table.png`,
				`${this.shelfIconPaths}down-1.png`,
				`${this.shelfIconPaths}down-2.png`,
				`${this.shelfIconPaths}shelf-indicator.png`
			];
		}
		
		if (this.shelfIconPaths.length < 5 && this.useShelf)
		{
			throw new Error("[Lapsa] Not enough shelf icons provided!");
		}
		
		if (this.shelfIconPaths.length < 6 && this.useShelfIndicator)
		{
			throw new Error("[Lapsa] No shelf indicator icon provided!");
		}

		this.slideAnimateInEasing = options.slideAnimateInEasing;
		this.slideAnimateOutEasing = options.slideAnimateOutEasing;
		this.shelfAnimateInEasing = options.shelfAnimateInEasing;
		this.shelfAnimateOutEasing = options.shelfAnimateOutEasing;
		this.tableViewEasing = options.tableViewEasing;

		
		this.appendHTML = options.appendHTML;
		
		this.dragDistanceThreshhold = options.dragDistanceThreshhold;
		
		
		
		this.#rootSelector = document.querySelector<HTMLElement>(":root");
		
		this.#resizeAnimationBound = this.#resizeAnimation.bind(this);
		
		
		
		this.slideContainer = document.body.querySelector("#lapsa-slide-container");
		this.slideContainer.classList.add("lapsa-hover");
		
		this.#bottomMarginElement = document.createElement("div");
		this.#bottomMarginElement.id = "lapsa-bottom-margin";
		this.slideContainer.appendChild(this.#bottomMarginElement);
		
		
		
		this.slides = document.body.querySelectorAll<HTMLElement>(".slide");
		
		this.#numBuilds = new Array(this.slides.length);
		
		this.slides.forEach((element, index) =>
		{
			const wrapper = document.createElement("div");
			wrapper.classList.add("lapsa-slide-wrapper");
			
			wrapper.style.top = window.innerWidth / window.innerHeight >= 152 / 89 ? `calc(${index * 100 + 2.5} * var(--safe-vh))` : `calc(${index * 100} * var(--safe-vh) + (100 * var(--safe-vh) - 55.625vw) / 2)`;
			
			this.slideContainer.insertBefore(wrapper, element);
			wrapper.appendChild(element);
			
			
			if (element.children.length !== 0)
			{
				element.lastElementChild.insertAdjacentHTML("afterend", this.appendHTML);
			}
			
			else
			{
				element.innerHTML = this.appendHTML;
			}
			
			
			
			element.addEventListener("click", () =>
			{
				if (!this.#inTableView)
				{
					return;
				}
				
				this.closeTableView(index);
			});
			
			
			
			element.addEventListener("touchstart", this.#handleTouchstartEvent.bind(this));
			
			element.addEventListener("touchmove", this.#handleTouchmoveEvent.bind(this));
			
			
			
			const builds = element.querySelectorAll(".build, [data-build]");
			
			let currentBuild = 0;
			
			this.#numBuilds[index] = 0;
			
			builds.forEach(buildElement =>
			{
				const attr = buildElement.getAttribute("data-build");
				
				if (attr === null)
				{
					buildElement.setAttribute("data-build", currentBuild.toString());
					
					currentBuild++;
				}
				
				else
				{
					currentBuild = parseInt(attr) + 1;
				}
				
				this.#numBuilds[index] = Math.max(this.#numBuilds[index], currentBuild);
				
				buildElement.classList.remove("build");
			});
			
			
			
			const functionalBuildKeys = Object.keys(this.callbacks?.[element.id] ?? {});
			
			let maxFunctionalBuild = 0;
			
			functionalBuildKeys.forEach(key => maxFunctionalBuild = Math.max(
				maxFunctionalBuild,
				(parseInt(key) + 1) || 0
			));
			
			this.#numBuilds[index] = Math.max(this.#numBuilds[index], maxFunctionalBuild);
		});
		
		this.#transitionAnimationDistance = window.innerWidth / window.innerHeight >= 152 / 89
			? window.innerHeight * this.transitionAnimationDistanceFactor * 159 / 82
			: window.innerWidth * this.transitionAnimationDistanceFactor;
		
		this.#safeVh = window.innerHeight / 100;
		this.#rootSelector.style.setProperty("--safe-vh", `${this.#safeVh}px`);
		
		
		
		this.#shelfContainer = document.createElement("div");
		this.#shelfContainer.id = "lapsa-slide-shelf-container";
		
		this.#shelfContainer.innerHTML = /* html */`
			<div id="lapsa-slide-shelf" class="lapsa-hover lapsa-interactable" style="margin-left: ${-this.#shelfMargin}px; opacity: 0">
				<input type="image" id="lapsa-up-2-button" class="shelf-button lapsa-interactable" src="${this.shelfIconPaths[0]}">
				<input type="image" id="lapsa-up-1-button" class="shelf-button lapsa-interactable" src="${this.shelfIconPaths[1]}">
				<input type="image" id="lapsa-table-button" class="shelf-button lapsa-interactable" src="${this.shelfIconPaths[2]}">
				<input type="image" id="lapsa-down-1-button" class="shelf-button lapsa-interactable" src="${this.shelfIconPaths[3]}">
				<input type="image" id="lapsa-down-2-button" class="shelf-button lapsa-interactable" src="${this.shelfIconPaths[4]}">
			</div>
		`;
		
		document.body.appendChild(this.#shelfContainer);
		
		
		
		this.#shelfIndicatorContainer = document.createElement("div");
		this.#shelfIndicatorContainer.id = "lapsa-slide-shelf-indicator-container";
		
		if (this.useShelfIndicator)
		{
			this.#shelfIndicatorContainer.innerHTML = /* html */`<img id="lapsa-slide-shelf-indicator" src="${this.shelfIconPaths[5]}"></img>`;
		}
		
		document.body.appendChild(this.#shelfIndicatorContainer);
		
		
		
		if ("scrollRestoration" in history)
		{
			history.scrollRestoration = "manual";
		}
		
		setTimeout(() => window.scrollTo(0, 0), 10);
		
		
		
		setTimeout(() =>
		{
			this.#slideShelf = document.querySelector("#lapsa-slide-shelf");
			
			if (this.useShelfIndicator)
			{
				this.#slideShelfIndicator = document.querySelector("#lapsa-slide-shelf-indicator");
			}
			
			if (this.permanentShelf)
			{
				this.#shelfContainer.classList.add("permanent-shelf");
				this.#showSlideShelf(this.#slideShelf);
				this.#shelfIsAnimating = false;
				this.#shelfIsOpen = true;
				
				this.#slideShelfIndicator.style.display = "none";
			}
			
			else
			{
				this.#hideSlideShelf(this.#slideShelf, 0);
			}
			
			
			
			this.#shelfContainer.addEventListener("mouseenter", () =>
			{
				if (!this.#shelfIsOpen && !this.permanentShelf && this.useShelf)
				{
					this.showShelf();
				}
			});
			
			this.#shelfContainer.addEventListener("mouseleave", () =>
			{
				if (this.#shelfIsOpen && !this.permanentShelf && this.useShelf)
				{
					this.hideShelf();
				}
			});
			
			this.#slideShelf.children[0].addEventListener("click", () =>
			{
				if (this.#shelfIsOpen && !this.#shelfIsAnimating)
				{
					this.previousSlide(true);
				}
			});
			
			this.#slideShelf.children[1].addEventListener("click", () =>
			{
				if (this.#shelfIsOpen && !this.#shelfIsAnimating)
				{
					this.previousSlide();
				}
			});
			
			this.#slideShelf.children[2].addEventListener("click", () =>
			{
				if (this.#shelfIsOpen && !this.#shelfIsAnimating)
				{
					if (this.#inTableView)
					{
						this.closeTableView(this.currentSlide);
					}
					
					else
					{
						this.openTableView();
					}
				}
			});
			
			this.#slideShelf.children[3].addEventListener("click", () =>
			{
				if (this.#shelfIsOpen && !this.#shelfIsAnimating)
				{
					this.nextSlide();
				}
			});
			
			this.#slideShelf.children[4].addEventListener("click", () =>
			{
				if (this.#shelfIsOpen && !this.#shelfIsAnimating)
				{
					this.nextSlide(true);
				}
			});
		}, 100);
		
		
		
		document.documentElement.style.overflowY = "hidden";
		document.body.style.overflowY = "hidden";
		document.body.style.userSelect = "none";
		
		this.#boundFunctions[0] = this.#handleKeydownEvent.bind(this);
		this.#boundFunctions[1] = this.#handleTouchstartEvent.bind(this);
		this.#boundFunctions[2] = this.#handleTouchmoveEvent.bind(this);
		this.#boundFunctions[3] = this.#handleMousemoveEvent.bind(this);
		this.#boundFunctions[4] = this.#onResize.bind(this);
		
		document.documentElement.addEventListener("keydown", this.#boundFunctions[0]);
		document.documentElement.addEventListener("touchstart", this.#boundFunctions[1]);
		document.documentElement.addEventListener("touchmove", this.#boundFunctions[2]);
		document.documentElement.addEventListener("mousemove", this.#boundFunctions[3]);
		window.addEventListener("resize", this.#boundFunctions[4]);
		
		setTimeout(() => this.jumpToSlide(this.#startingSlide), 500);
	}
	
	
	
	exit()
	{
		this.slideContainer.remove();
		this.#shelfContainer.remove();
		this.#shelfIndicatorContainer.remove();
		
		this.slides.forEach(element => element.remove());
		
		document.documentElement.style.overflowY = "visible";
		document.body.style.overflowY = "visible";
		document.body.style.height = "fit-content";
		document.body.style.userSelect = "auto";
		
		document.documentElement.removeEventListener("keydown", this.#boundFunctions[0]);
		document.documentElement.removeEventListener("touchstart", this.#boundFunctions[1]);
		document.documentElement.removeEventListener("touchmove", this.#boundFunctions[2]);
		document.documentElement.removeEventListener("mousemove", this.#boundFunctions[3]);
		window.removeEventListener("resize", this.#boundFunctions[4]);
	}
	
	
	
	#onResize()
	{
		if (this.#currentlyAnimating)
		{
			return;
		}
		
		this.#transitionAnimationDistance = window.innerWidth / window.innerHeight >= 152 / 89
			? window.innerHeight * this.transitionAnimationDistanceFactor * 159 / 82
			: window.innerWidth * this.transitionAnimationDistanceFactor;
		
		
		
		if (this.#inTableView)
		{
			const bodyRect = document.body.getBoundingClientRect();
			
			const slidesPerScreen = bodyRect.width / bodyRect.height >= 152 / 89
				? 1
				: bodyRect.height / (bodyRect.width * 89 / 152);
			
			const scale = Math.min(slidesPerScreen / this.tableViewSlidesPerScreen, 1);
			
			const scaledSlidesPerScreen = slidesPerScreen / scale;
			
			
			
			// The first and last several slides have different animations
			// since they can't be in the middle of the screen in the table view.
			const centerSlide = Math.min(
				Math.max(
					(scaledSlidesPerScreen - 1) / 2,
					this.currentSlide
				), this.slides.length - 1 - (scaledSlidesPerScreen - 1) / 2);
			
			const translation = bodyRect.width / bodyRect.height >= 152 / 89
				? (58.125 * 152 / 89 * centerSlide - 100 * centerSlide) * scale * this.#safeVh
				: (58.125 * centerSlide) * scale * window.innerWidth / 100
					- 100 * centerSlide * scale * this.#safeVh;
			
			
			
			this.slides.forEach((element, index) =>
			{
				if (window.innerWidth / window.innerHeight >= 152 / 89)
				{
					element.parentElement.style.top = `calc(${5 + 58.125 * 152 / 89 * (index - centerSlide) + 100 * centerSlide} * var(--safe-vh))`;
				}
				
				else
				{
					element.parentElement.style.top = `calc(${2.5 + 58.125 * (index - centerSlide)}vw + ${100 * centerSlide} * var(--safe-vh))`;
				}
			});
			
			if (window.innerWidth / window.innerHeight >= 152 / 89)
			{
				this.#bottomMarginElement.style.top = `calc(${5 + 58.125 * 152 / 89 * (this.slides.length - centerSlide) + 100 * centerSlide} * var(--safe-vh))`;
			}
			
			else
			{
				this.#bottomMarginElement.style.top = `calc(${2.5 + 58.125 * (this.slides.length - centerSlide)}vw + ${100 * centerSlide} * var(--safe-vh))`;
			}
			
			
			
			this.slideContainer.style.transform = `matrix(${scale}, 0, 0, ${scale}, 0, ${translation})`;
			
			
			if (this.resizeOnTableView)
			{
				this.#startWindowHeight = this.#lastWindowHeight;
				this.#windowHeightAnimationFrame = 1;
				window.requestAnimationFrame(this.#resizeAnimationBound);
			}
			
			else
			{
				this.#missedResizeAnimation = true;
			}
		}
		
		
		
		else
		{
			this.#safeVh = window.innerHeight / 100;
			this.#rootSelector.style.setProperty("--safe-vh", `${this.#safeVh}px`);
			
			this.slides.forEach((element, index) => element.parentElement.style.top = window.innerWidth / window.innerHeight >= 152 / 89 ? `calc(${index * 100 + 2.5} * var(--safe-vh))` : `calc(${index * 100} * var(--safe-vh) + (100 * var(--safe-vh) - 55.625vw) / 2)`);
			
			this.slideContainer.style.transform = `matrix(1, 0, 0, 1, 0, ${-100 * this.currentSlide * this.#safeVh})`;
		}
	}
	
	
	
	#resizeAnimation(timestamp)
	{
		const timeElapsed = timestamp = this.#windowHeightAnimationLastTimestamp;
		
		this.#windowHeightAnimationLastTimestamp = timestamp;
		
		if (timeElapsed === 0)
		{
			return;
		}
		
		const t = .5 * (
			1 + Math.cos(
				Math.PI * (this.#windowHeightAnimationFrame / this.windowHeightAnimationFrames + 1)
			)
		);
		
		const newHeight = this.#startWindowHeight * (1 - t) + window.innerHeight * t;
		
		this.#lastWindowHeight = newHeight;
		
		
		
		this.#safeVh = newHeight / 100;
		this.#rootSelector.style.setProperty("--safe-vh", `${this.#safeVh}px`);
		
		if (this.#inTableView)
		{
			const slidesPerScreen = window.innerWidth / newHeight >= 152 / 89
				? 1
				: newHeight / (window.innerWidth * 89 / 152);
			
			const scale = Math.min(slidesPerScreen / this.tableViewSlidesPerScreen, 1);
			
			const scaledSlidesPerScreen = slidesPerScreen / scale;
			
			const centerSlide = Math.min(
				Math.max(
					(scaledSlidesPerScreen - 1) / 2,
					this.currentSlide
				),
				this.slides.length - 1 - (scaledSlidesPerScreen - 1) / 2
			);
			
			const translation = window.innerWidth / newHeight >= 152 / 89
				? (58.125 * 152 / 89 * centerSlide - 100 * centerSlide) * scale * this.#safeVh
				: (58.125 * centerSlide) * scale * window.innerWidth / 100
					- 100 * centerSlide * scale * this.#safeVh;
			
			this.slideContainer.style.transform = `matrix(${scale}, 0, 0, ${scale}, 0, ${translation})`;
		}
		
		
		
		this.#windowHeightAnimationFrame++;
		
		if (this.#windowHeightAnimationFrame <= this.windowHeightAnimationFrames)
		{
			window.requestAnimationFrame(this.#resizeAnimationBound);
		}
	}
	
	
	
	async nextSlide(skipBuilds = false)
	{
		if (this.#currentlyAnimating || this.#inTableView)
		{
			return;
		}
		
		this.#currentlyAnimating = true;
		
		
		
		// If there's a build available, we do that instead of moving to the next slide.
		if (
			this.currentSlide >= 0
			&& !skipBuilds && this.#numBuilds[this.currentSlide] !== 0
			&& this.buildState !== this.#numBuilds[this.currentSlide]
		) {
			const promises = [];
			
			// Gross code because animation durations are weird as hell --
			// see the corresponding previousSlide block for a better example.
			this.slides[this.currentSlide].querySelectorAll(`[data-build="${this.buildState}"]`).forEach(element =>
			{
				this.buildIn(element, this.transitionAnimationTime * 2);
				
				promises.push(
					new Promise(resolve => setTimeout(resolve, this.transitionAnimationTime))
				);
			});
			
			try
			{
				const callbacks = this.callbacks[this.slides[this.currentSlide].id];

				const callback = callbacks[this.buildState];

				promises.push(callback(this.slides[this.currentSlide], true));
			}

			catch(ex)
			{
				// No callback defined
			}
			
			await Promise.all(promises);
			
			this.buildState++;
			
			this.#currentlyAnimating = false;
			
			return;
		}
		
		
		
		if (this.currentSlide === this.slides.length - 1)
		{
			this.#currentlyAnimating = false;
			
			return;
		}
		
		
		// Fade out the current slide, show all its builds (for the table view),
		// then load in the next slide and hide all of its builds.
		
		await this.fadeUpOut(this.slideContainer, this.transitionAnimationTime);
		
		// Reset the slide if necessary.
		if (this.currentSlide >= 0 && this.buildState !== this.#numBuilds[this.currentSlide])
		{
			try
			{
				const callbacks = this.callbacks[this.slides[this.currentSlide].id];

				const callback = callbacks.reset;

				await callback(this.slides[this.currentSlide], true, 0);
			}

			catch(ex)
			{
				// No reset defined
			}
			
			this.slides[this.currentSlide].querySelectorAll<HTMLElement>("[data-build]")
				.forEach(element => element.style.opacity = "1");
		}
		
		
		
		this.currentSlide++;
		
		this.buildState = 0;
		
		

		try
		{
			const callbacks = this.callbacks[this.slides[this.currentSlide].id];

			const callback = callbacks.reset;

			await callback(this.slides[this.currentSlide], true, 0);
		}

		catch(ex)
		{
			// No reset defined
		}
		
		
		
		this.slides[this.currentSlide].querySelectorAll<HTMLElement>("[data-build]")
			.forEach(element => element.style.opacity = "0");
		
		this.slideContainer.style.transform = `matrix(1, 0, 0, 1, 0, ${-100 * this.currentSlide * this.#safeVh})`;
		
		await this.fadeUpIn(this.slideContainer, this.transitionAnimationTime * 2);
		
		this.#currentlyAnimating = false;
	}
	
	
	
	async previousSlide(skipBuilds = false)
	{
		if (this.#currentlyAnimating || this.#inTableView)
		{
			return;
		}
		
		this.#currentlyAnimating = true;
		
		
		
		// If there's a build available, we do that instead of moving to the previous slide.
		if (!skipBuilds && this.#numBuilds[this.currentSlide] !== 0 && this.buildState !== 0)
		{
			this.buildState--;
			
			const promises = [];
			
			this.slides[this.currentSlide].querySelectorAll(`[data-build="${this.buildState}"]`).forEach(element => promises.push(this.buildOut(element, this.transitionAnimationTime)));
			
			try
			{
				const callbacks = this.callbacks[this.slides[this.currentSlide].id];

				const callback = callbacks[this.buildState];

				await callback(this.slides[this.currentSlide], false);
			}

			catch(ex)
			{
				// No callback defined
			}
			
			await Promise.all(promises);
			
			this.#currentlyAnimating = false;
			
			return;
		}
		
		
		
		if (this.currentSlide === 0 || this.currentSlide === this.slides.length)
		{
			this.#currentlyAnimating = false;
			
			return;
		}
		
		
		
		// Fade out the current slide, show all its builds (for the table view),
		// then load in the previous slide and show all of its builds.
		
		await this.fadeDownOut(this.slideContainer, this.transitionAnimationTime);
		
		// Reset the slide if necessary.
		if (this.buildState !== this.#numBuilds[this.currentSlide])
		{
			try
			{
				const callbacks = this.callbacks[this.slides[this.currentSlide].id];

				const callback = callbacks.reset;

				await callback(this.slides[this.currentSlide], false, 0);
			}

			catch(ex)
			{
				// No reset defined
			}
			
			this.slides[this.currentSlide].querySelectorAll<HTMLElement>("[data-build]")
				.forEach(element => element.style.opacity = "1");
		}
		
		
		
		this.currentSlide--;
		
		this.buildState = this.#numBuilds[this.currentSlide];
		
		
		try
		{
			const callbacks = this.callbacks[this.slides[this.currentSlide].id];

			const callback = callbacks.reset;

			await callback(this.slides[this.currentSlide], false, 0);
		}

		catch(ex)
		{
			// No reset defined
		}
		
		
		
		this.slides[this.currentSlide].querySelectorAll<HTMLElement>("[data-build]")
			.forEach(element => element.style.opacity = "1");
		
		this.slideContainer.style.transform = `matrix(1, 0, 0, 1, 0, ${-100 * this.currentSlide * this.#safeVh})`;
		
		await this.fadeDownIn(this.slideContainer, this.transitionAnimationTime * 2);
		
		this.#currentlyAnimating = false;
	}
	
	
	
	async jumpToSlide(index)
	{
		if (this.#currentlyAnimating || this.#inTableView)
		{
			return;
		}
		
		this.#currentlyAnimating = true;
		
		
		
		if (index < 0 || index >= this.slides.length || index === this.currentSlide)
		{
			this.#currentlyAnimating = false;
			
			return;
		}
		
		
		
		const forwardAnimation = index > this.currentSlide;
		
		if (forwardAnimation)
		{
			await this.fadeUpOut(this.slideContainer, this.transitionAnimationTime);
		}
		
		else
		{
			await this.fadeDownOut(this.slideContainer, this.transitionAnimationTime);
		}
		
		
		
		// Reset the slide if necessary.
		if (this.currentSlide !== -1 && this.buildState !== this.#numBuilds[this.currentSlide])
		{
			try
			{
				const callbacks = this.callbacks[this.slides[this.currentSlide].id];

				const callback = callbacks.reset;

				await callback(this.slides[this.currentSlide], false, 0);
			}

			catch(ex)
			{
				// No reset defined
			}
			
			this.slides[this.currentSlide].querySelectorAll<HTMLElement>("[data-build]")
				.forEach(element => element.style.opacity = "1");
		}
		
		
		
		this.currentSlide = index;
		this.buildState = 0;
		
		

		try
		{
			const callbacks = this.callbacks[this.slides[this.currentSlide].id];

			const callback = callbacks.reset;

			await callback(this.slides[this.currentSlide], true, 0);
		}

		catch(ex)
		{
			// No reset defined
		}
		
		
		
		this.slides[this.currentSlide].querySelectorAll<HTMLElement>("[data-build]")
			.forEach(element => element.style.opacity = "0");
		
		this.slideContainer.style.transform = `matrix(1, 0, 0, 1, 0, ${-100 * this.currentSlide * this.#safeVh})`;
		
		if (forwardAnimation)
		{
			await this.fadeUpIn(this.slideContainer, this.transitionAnimationTime * 2);
		}
		
		else
		{
			await this.fadeDownIn(this.slideContainer, this.transitionAnimationTime * 2);
		}
		
		
		
		this.#currentlyAnimating = false;
	}
	
	
	
	async openTableView(duration = this.tableViewAnimationTime)
	{
		if (this.#inTableView || this.#currentlyAnimating)
		{
			return;
		}
		
		this.#currentlyAnimating = true;
		
		
		
		if (this.#currentlyTouchDevice)
		{
			this.hideShelf();
		}
		
		document.body.style.overflowY = "visible";
		document.body.style.position = "relative";
		this.slideContainer.style.overflowY = "visible";
		
		const bodyRect = document.body.getBoundingClientRect();
		
		// The goal is to have room to display just under 4 slides vertically,
		// then center on one so that the others are clipped, indicating it's scrollable.
		// In a horizontal orientation, exactly one slide fits per screen.
		// In a vertical one, we take a ratio.
		const slidesPerScreen = bodyRect.width / bodyRect.height >= 152 / 89
			? 1
			: bodyRect.height / (bodyRect.width * 89 / 152);
		
		const scale = Math.min(slidesPerScreen / this.tableViewSlidesPerScreen, 1);
		
		const scaledSlidesPerScreen = slidesPerScreen / scale;
		
		
		
		// The first and last two slides have different animations since
		// they can't be in the middle of the screen in the table view.
		const centerSlide = Math.min(
			Math.max(
				(scaledSlidesPerScreen - 1) / 2,
				this.currentSlide
			),
			this.slides.length - 1 - (scaledSlidesPerScreen - 1) / 2
		);
		
		this.slideContainer.style.transformOrigin = `center calc(${this.currentSlide * 100 + 50} * var(--safe-vh))`;
		
		const translation = bodyRect.width / bodyRect.height >= 152 / 89
			? (58.125 * 152 / 89 * centerSlide - 100 * centerSlide) * scale * this.#safeVh
			: (58.125 * centerSlide) * scale * window.innerWidth / 100
				- 100 * centerSlide * scale * this.#safeVh;
		
		this.slideContainer.style.transition = `transform ${duration}ms ${this.tableViewEasing}`;
		
		this.slideContainer.style.transform = bodyRect.width / bodyRect.height >= 152 / 89
			? `matrix(${scale}, 0, 0, ${scale}, 0, ${((this.currentSlide - centerSlide) * 58.125 * 152 / 89 * scale - 100 * this.currentSlide) * this.#safeVh})`
			: `matrix(${scale}, 0, 0, ${scale}, 0, ${(this.currentSlide - centerSlide) * 58.125 * scale * window.innerWidth / 100 - 100 * this.currentSlide * this.#safeVh})`;

		this.slides.forEach((element, index) =>
		{
			element.parentElement.style.transition = `top ${duration}ms ${this.tableViewEasing}`;
			
			// On these, we include the top margin term to match with how
			// things were before -- otherwise, the transformation center will be misaligned.
			if (bodyRect.width / bodyRect.height >= 152 / 89)
			{
				element.parentElement.style.top = `calc(${58.125 * 152 / 89 * (index - this.currentSlide) + 100 * this.currentSlide + 2.5} * var(--safe-vh))`;
			}
			
			else
			{
				element.parentElement.style.top = `calc(${58.125 * (index - this.currentSlide)}vw + ${100 * this.currentSlide} * var(--safe-vh) + (100 * var(--safe-vh) - 55.625vw) / 2)`;
			}
		});
		
		
		
		// While all the slides are moving, we also show all builds that are
		// currently hidden and request that the slide be reset to its final state.
		if (this.buildState !== this.#numBuilds[this.currentSlide])
		{
			const builds = this.slides[this.currentSlide].querySelectorAll<HTMLElement>("[data-build]");
			const oldTransitionStyles = new Array(builds.length);
			
			builds.forEach((element, index) =>
			{
				oldTransitionStyles[index] = element.style.transition;
				
				element.style.transition = `opacity ${duration / 2}ms ${this.slideAnimateOutEasing}`;
				
				element.style.opacity = "1";
			});
			
			// We don't await this one because we want it to run concurrently
			// with the table view animation.
			try
			{
				const callbacks = this.callbacks[this.slides[this.currentSlide].id];

				const callback = callbacks.reset;

				callback(this.slides[this.currentSlide], false, duration / 2);
			}

			catch(ex)
			{
				// No reset defined
			}
			
			setTimeout(() =>
			{
				builds.forEach((element, index) =>
				{
					element.style.transition = oldTransitionStyles[index];
				});
			}, duration / 2);
		}
		
		
		
		// Only once this is done can we snap to the end. They'll never know the difference!
		await new Promise<void>(resolve =>
		{
			setTimeout(() =>
			{
				const correctTop = this.slides[this.currentSlide].getBoundingClientRect().top;
				
				this.slideContainer.style.transition = "";
				
				this.slides.forEach((element, index) =>
				{
					element.parentElement.style.transition = "";
					
					// Here, we no longer include the margin, since we don't want the slides
					// to have a gap at the top. It's accounted for in the translation amount
					// on the container, so it's all fine. The 5 is due to a somewhat strange effect
					// that I don't quite understand.
					if (bodyRect.width / bodyRect.height >= 152 / 89)
					{
						element.parentElement.style.top = `calc(${5 + 58.125 * 152 / 89 * (index - centerSlide) + 100 * centerSlide} * var(--safe-vh))`;
					}
					
					else
					{
						element.parentElement.style.top = `calc(${2.5 + 58.125 * (index - centerSlide)}vw + ${100 * centerSlide} * var(--safe-vh))`;
					}
				});
				
				if (window.innerWidth / window.innerHeight >= 152 / 89)
				{
					this.#bottomMarginElement.style.top = `calc(${5 + 58.125 * 152 / 89 * (this.slides.length - centerSlide) + 100 * centerSlide} * var(--safe-vh))`;
				}
				
				else
				{
					this.#bottomMarginElement.style.top = `calc(${2.5 + 58.125 * (this.slides.length - centerSlide)}vw + ${100 * centerSlide} * var(--safe-vh))`;
				}
				
				
				
				this.slideContainer.style.transformOrigin = "center top";
				
				this.slideContainer.style.transform = `matrix(${scale}, 0, 0, ${scale}, 0, ${translation})`;
				
				document.documentElement.style.overflowY = "visible";
				
				const newTop = this.slides[this.currentSlide].getBoundingClientRect().top;
				
				// The old way was to scroll to correctTop and get newTop at that point.
				// If correctTop was 100 and newTop was 25, then after scrolling to position 100,
				// newTop was 25 further, so it was 125 at first.
				// Therefore, we want newTop - correctTop here.
				
				window.scrollTo(0, newTop - correctTop);
				
				this.#currentlyAnimating = false;
				this.#inTableView = true;
				this.#missedResizeAnimation = false;
				this.slideContainer.classList.add("lapsa-table-view");
				
				resolve();
			}, duration);
		});
	}
	
	
	
	async closeTableView(selection, duration = this.tableViewAnimationTime)
	{
		if (!this.#inTableView || this.#currentlyAnimating)
		{
			return;
		}
		
		this.#currentlyAnimating = true;
		
		this.currentSlide = selection;
		
		this.slideContainer.classList.remove("lapsa-table-view");
		
		
		
		// As with opening, this is a two-step process. First we snap back to a translated version,
		// and then we return everything to its rightful place.
		
		const bodyRect = document.body.getBoundingClientRect();
		
		// The goal is to have room to display just under 4 slides vertically,
		// then center on one so that the others are clipped, indicating it's scrollable.
		// In a horizontal orientation, exactly one slide fits per screen.
		// In a vertical one, we take a ratio.
		const slidesPerScreen = bodyRect.width / bodyRect.height >= 152 / 89
			? 1
			: bodyRect.height / (bodyRect.width * 89 / 152);
		
		const scale = Math.min(slidesPerScreen / this.tableViewSlidesPerScreen, 1);
		
		
		// The first and last two slides have different animations since they can't be
		// in the middle of the screen in the table view.
		const centerSlide = Math.min(Math.max(1.25, this.currentSlide), this.slides.length - 2.25);
		
		const correctTop = this.slides[0].getBoundingClientRect().top;
		
		
		
		document.documentElement.style.overflowY = "hidden";
		document.body.style.overflowY = "hidden";
		
		this.slideContainer.style.transformOrigin = `center calc(${centerSlide * 100 + 50} * var(--safe-vh))`;
		
		
		
		this.slides.forEach((element, index) =>
		{
			// On these, we include the top margin term to match with how things were before --
			// otherwise, the transformation center will be misaligned.
			if (bodyRect.width / bodyRect.height >= 152 / 89)
			{
				element.parentElement.style.top = `calc(${58.125 * 152 / 89 * (index - this.currentSlide) + 100 * this.currentSlide + 2.5} * var(--safe-vh))`;
			}
			
			else
			{
				element.parentElement.style.top = `calc(${58.125 * (index - this.currentSlide)}vw + ${100 * this.currentSlide} * var(--safe-vh) + (100 * var(--safe-vh) - 55.625vw) / 2)`;
			}
		});
		
		this.#bottomMarginElement.style.top = "0";
		
		
		
		this.slideContainer.style.transform = `matrix(${scale}, 0, 0, ${scale}, 0, 0)`;
		
		window.scrollTo(0, 0);
		
		const newTop = this.slides[0].getBoundingClientRect().top;
		
		const scroll = correctTop - newTop;
		
		this.slideContainer.style.transform = `matrix(${scale}, 0, 0, ${scale}, 0, ${scroll})`;
		
		
		
		// While all the slides are moving, we also hide all builds that are currently shown
		// and request that the slide be reset to its initial state.
		const builds = this.slides[this.currentSlide].querySelectorAll<HTMLElement>("[data-build]");
		const oldTransitionStyles = new Array(builds.length);
		
		builds.forEach((element, index) =>
		{
			oldTransitionStyles[index] = element.style.transition;
			
			element.style.transition = `opacity ${duration / 3}ms ${this.slideAnimateInEasing}`;
			
			element.style.opacity = "0";
		});
		
		// We don't await this one because we want it to run concurrently
		// with the table view animation.
		try
		{
			const callbacks = this.callbacks[this.slides[this.currentSlide].id];

			const callback = callbacks.reset;

			callback(this.slides[this.currentSlide], true, duration / 3);
		}

		catch(ex)
		{
			// No reset defined
		}
		
		setTimeout(() =>
		{
			builds.forEach((element, index) =>
			{
				element.style.transition = oldTransitionStyles[index];
			});
		}, duration / 3);
		
		
		
		// Now we can return all the slides to their proper places.
		
		// Someday, I will understand why these four lines need to be
		// the way they are. And then I will finally rest.
		this.slideContainer.style.transition = "";
		this.slideContainer.style.transform = `matrix(${scale}, 0, 0, ${scale}, 0, ${scroll})`;
		
		await new Promise<void>(resolve =>
		{
			setTimeout(() =>
			{
				this.slideContainer.style.transition = `transform ${duration}ms ${this.tableViewEasing}`;
				this.slideContainer.style.transform = `matrix(1, 0, 0, 1, 0, ${-100 * this.currentSlide * this.#safeVh})`;
			
				
				this.slides.forEach((element, index) =>
				{
					element.parentElement.style.transition = `top ${duration}ms ${this.tableViewEasing}`;
					
					element.parentElement.style.top = window.innerWidth / window.innerHeight >= 152 / 89 ? `calc(${index * 100 + 2.5} * var(--safe-vh))` : `calc(${index * 100} * var(--safe-vh) + (100 * var(--safe-vh) - 55.625vw) / 2)`;
				});
				
				setTimeout(() =>
				{
					builds.forEach((element, index) =>
					{
						element.style.transition = oldTransitionStyles[index];
					});
					this.buildState = 0;
					
					this.slideContainer.style.transition = "";
					
					this.slides.forEach(element => element.parentElement.style.transition = "");
					
					this.#currentlyAnimating = false;
					this.#inTableView = false;
					
					document.body.style.position = "fixed";
					
					if (this.#missedResizeAnimation)
					{
						this.#startWindowHeight = this.#lastWindowHeight;
						this.#windowHeightAnimationFrame = 1;
						window.requestAnimationFrame(this.#resizeAnimationBound);
					}
					
					resolve();
				}, duration);
			}, 16);
		});
	}
	
	
	
	async showShelf()
	{
		if (this.permanentShelf || this.#shelfIsAnimating)
		{
			return;
		}
		
		
		
		this.#shelfIsOpen = true;
		this.#shelfIsAnimating = true;
		
		this.#slideShelf.style.display = "flex";
		this.#slideShelf.parentElement.style.paddingRight = "100px";
		
		setTimeout(async () =>
		{
			this.#hideSlideShelfIndicator(this.#slideShelfIndicator);
			await this.#showSlideShelf(this.#slideShelf);
			
			this.#shelfIsAnimating = false;
		}, 16);
	}
	
	async hideShelf()
	{
		if (this.permanentShelf || this.#shelfIsAnimating)
		{
			return;
		}
		
		
		
		this.#shelfIsOpen = false;
		this.#shelfIsAnimating = true;
		
		this.#slideShelf.parentElement.style.paddingRight = "0";
		
		this.#showSlideShelfIndicator(this.#slideShelfIndicator);
		await this.#hideSlideShelf(this.#slideShelf);
		
		this.#slideShelf.style.display = "none";
		this.#slideShelf.parentElement.style.paddingRight = "";
		
		this.#shelfIsAnimating = false;
	}
	
	async #showSlideShelf(element, duration = this.shelfAnimationTime)
	{
		const oldTransitionStyle = element.style.transition;
		element.style.transition = `margin-left ${duration}ms ${this.shelfAnimateInEasing}, opacity ${duration}ms ${this.shelfAnimateInEasing}`;
		
		element.style.marginLeft = `${this.#shelfMargin}px`;
		element.style.opacity = 1;
		
		await new Promise<void>(resolve =>
		{
			setTimeout(() =>
			{
				element.style.transition = oldTransitionStyle;
				resolve();
			}, duration);
		});
	}
	
	async #hideSlideShelf(element, duration = this.shelfAnimationTime)
	{
		const oldTransitionStyle = element.style.transition;
		element.style.transition = `margin-left ${duration}ms ${this.shelfAnimateOutEasing}, opacity ${duration}ms ${this.shelfAnimateOutEasing}`;
		
		element.style.marginLeft = `${-this.#shelfMargin}px`;
		element.style.opacity = 0;
		
		await new Promise<void>(resolve =>
		{
			setTimeout(() =>
			{
				element.style.transition = oldTransitionStyle;
				resolve();
			}, duration);
		});
	}
	
	async #showSlideShelfIndicator(element, duration = this.shelfAnimationTime)
	{
		if (!this.useShelfIndicator)
		{
			return;
		}
		
		const oldTransitionStyle = element.style.transition;
		element.style.transition = `opacity ${duration}ms ${this.shelfAnimateOutEasing}`;
		
		element.style.opacity = 1;
		
		await new Promise<void>(resolve =>
		{
			setTimeout(() =>
			{
				element.style.transition = oldTransitionStyle;
				resolve();
			}, duration);
		});
	}
	
	async #hideSlideShelfIndicator(element, duration = this.shelfAnimationTime)
	{
		if (!this.useShelfIndicator)
		{
			return;
		}
		
		const oldTransitionStyle = element.style.transition;
		element.style.transition = `opacity ${duration}ms ${this.shelfAnimateInEasing}`;
		
		element.style.opacity = 0;
		
		await new Promise<void>(resolve =>
		{
			setTimeout(() =>
			{
				element.style.transition = oldTransitionStyle;
				resolve();
			}, duration);
		});
	}
	
	
	
	#handleKeydownEvent(e)
	{
		if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " " || e.key === "Enter")
		{
			this.nextSlide();
		}
		
		else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
		{
			this.previousSlide();
		}
	}
	
	#handleTouchstartEvent(e)
	{
		this.#currentlyTouchDevice = true;
		this.#slideShelf.classList.remove("lapsa-hover");
		this.slideContainer.classList.remove("lapsa-hover");
		
		this.#currentlyDragging = false;
		
		if (
			this.#inTableView
			|| e.touches.length > 1
			|| e.target.classList.contains("lapsa-interactable")
		) {
			return;
		}
		
		this.#currentlyDragging = true;
		
		this.#lastMoveThisDrag = 0;
		
		this.#dragDistanceX = 0;
		this.#lastTouchX = -1;
		this.#dragDistanceY = 0;
		this.#lastTouchY = -1;
	}
	
	#handleTouchmoveEvent(e)
	{
		if (this.#inTableView || !this.#currentlyDragging || e.touches.length > 1)
		{
			return;
		}
		
		if (e.target.classList.contains("lapsa-interactable"))
		{
			return;
		}
		
		
		
		e.preventDefault();
		
		
		
		if (this.#lastTouchY === -1)
		{
			this.#lastTouchY = e.touches[0].clientY;
		}
		
		else
		{
			this.#dragDistanceY += e.touches[0].clientY - this.#lastTouchY;
			
			this.#lastTouchY = e.touches[0].clientY;
			
			if (
				this.#dragDistanceY < -this.dragDistanceThreshhold
				&& (
					this.#lastMoveThisDrag === 0
					|| this.#lastMoveThisDrag === -1
				)
			) {
				this.#lastMoveThisDrag = 1;
				
				this.nextSlide();
			}
			
			else if (
				this.#dragDistanceY > this.dragDistanceThreshhold
				&& (
					this.#lastMoveThisDrag === 0
					|| this.#lastMoveThisDrag === 1
				)
			) {
				this.#lastMoveThisDrag = -1;
				
				this.previousSlide();
			}
		}
		
		
		
		if (this.#lastTouchX === -1)
		{
			this.#lastTouchX = e.touches[0].clientX;
		}
		
		else
		{
			this.#dragDistanceX += e.touches[0].clientX - this.#lastTouchX;
			
			this.#lastTouchX = e.touches[0].clientX;
			
			if (
				this.#dragDistanceX < -this.dragDistanceThreshhold
				&& (
					this.#lastMoveThisDrag === 0
					|| this.#lastMoveThisDrag === 2
				)
			) {
				this.#lastMoveThisDrag = -2;
				
				this.hideShelf();
			}
			
			else if (
				this.#dragDistanceX > this.dragDistanceThreshhold
				&& (
					this.#lastMoveThisDrag === 0
					|| this.#lastMoveThisDrag === -2
				)
			) {
				this.#lastMoveThisDrag = 2;
				
				this.showShelf();
			}
		}
	}
	
	#handleTouchendEvent()
	{
		setTimeout(() => this.#slideShelf.classList.remove("lapsa-hover"), 50);
		setTimeout(() => this.slideContainer.classList.remove("lapsa-hover"), 50);
	}
	
	#handleMousemoveEvent()
	{
		if (this.#currentlyTouchDevice)
		{
			const timeBetweenMousemoves = Date.now() - this.#lastMousemoveEvent;
			
			this.#lastMousemoveEvent = Date.now();
			
			// Checking if it's >= 3 kinda sucks, but it seems like touch devices
			// like to fire two mousemoves in quick succession sometimes.
			// They also like to make that delay exactly 33.
			// Look, I hate this too, but it needs to be here.
			if (
				timeBetweenMousemoves >= 3
				&& timeBetweenMousemoves <= 50
				&& timeBetweenMousemoves !== 33
			) {
				this.#currentlyTouchDevice = false;
				this.#slideShelf.classList.add("lapsa-hover");
				this.slideContainer.classList.add("lapsa-hover");
			}
		}
	}
	
	
	
	async fadeUpIn(element, duration)
	{
		element.style.marginTop = `${this.#transitionAnimationDistance}px`;
		
		await new Promise<void>(resolve =>
		{
			setTimeout(() =>
			{
				const oldTransitionStyle = element.style.transition;
				element.style.transition = `margin-top ${duration}ms ${this.slideAnimateInEasing}, opacity ${duration}ms ${this.slideAnimateInEasing}`;
				
				element.style.marginTop = 0;
				element.style.opacity = 1;
			
				setTimeout(() =>
				{
					element.style.transition = oldTransitionStyle;
					resolve();
				}, duration);
			}, 16);
		});
	}
	
	async fadeUpOut(element, duration)
	{
		const oldTransitionStyle = element.style.transition;
		element.style.transition = `margin-top ${duration}ms ${this.slideAnimateOutEasing}, opacity ${duration}ms ${this.slideAnimateOutEasing}`;
		
		element.style.marginTop = `${-this.#transitionAnimationDistance}px`;
		element.style.opacity = 0;
		
		await new Promise<void>(resolve =>
		{
			setTimeout(() =>
			{
				element.style.transition = oldTransitionStyle;
				resolve();
			}, duration);
		});
	}
	
	async fadeDownIn(element, duration)
	{
		element.style.marginTop = `${-this.#transitionAnimationDistance}px`;
		
		await new Promise<void>(resolve =>
		{
			setTimeout(() =>
			{
				const oldTransitionStyle = element.style.transition;
				element.style.transition = `margin-top ${duration}ms ${this.slideAnimateInEasing}, opacity ${duration}ms ${this.slideAnimateInEasing}`;
				
				element.style.marginTop = 0;
				element.style.opacity = 1;
				
				setTimeout(() =>
				{
					element.style.transition = oldTransitionStyle;
					resolve();
				}, duration);
			}, 16);
		});
	}
	
	async fadeDownOut(element, duration)
	{
		const oldTransitionStyle = element.style.transition;
		element.style.transition = `margin-top ${duration}ms ${this.slideAnimateOutEasing}, opacity ${duration}ms ${this.slideAnimateOutEasing}`;
		
		element.style.marginTop = `${this.#transitionAnimationDistance}px`;
		element.style.opacity = 0;
		
		await new Promise<void>(resolve =>
		{
			setTimeout(() =>
			{
				element.style.transition = oldTransitionStyle;
				resolve();
			}, duration);
		});
	}
	
	
	
	async buildIn(element, duration)
	{
		element.style.marginTop = `${this.#transitionAnimationDistance}px`;
		element.style.marginBottom = `${-this.#transitionAnimationDistance}px`;
		
		await new Promise<void>(resolve =>
		{
			setTimeout(() =>
			{
				const oldTransitionStyle = element.style.transition;
				element.style.transition = `margin-top ${duration}ms ${this.slideAnimateInEasing}, margin-bottom ${duration}ms ${this.slideAnimateInEasing}, opacity ${duration}ms ${this.slideAnimateInEasing}`;
				
				element.style.marginTop = 0;
				element.style.marginBottom = 0;
				element.style.opacity = 1;
				
				setTimeout(() =>
				{
					element.style.transition = oldTransitionStyle;
					resolve();
				}, duration);
			}, 16);
		});
	}
	
	async buildOut(element, duration)
	{
		await new Promise<void>(resolve =>
		{
			setTimeout(() =>
			{
				const oldTransitionStyle = element.style.transition;
				element.style.transition = `margin-top ${duration}ms ${this.slideAnimateInEasing}, margin-bottom ${duration}ms ${this.slideAnimateInEasing}, opacity ${duration}ms ${this.slideAnimateInEasing}`;
				
				element.style.marginTop = `${this.#transitionAnimationDistance}px`;
				element.style.marginBottom = `${-this.#transitionAnimationDistance}px`;
				element.style.opacity = 0;
				
				setTimeout(() =>
				{
					element.style.transition = oldTransitionStyle;
					resolve();
				}, duration);
			}, 16);
		});
	}
}