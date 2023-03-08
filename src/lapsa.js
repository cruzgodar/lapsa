class Lapsa
{
	callbacks = {};
	slideContainer = null;
	slides = [];
	currentSlide = -1;
	buildState = 0;
	tableViewSlidesPerScreen = 4;
	
	shelfIconPaths = ["/icons/up-2.png", "/icons/up-1.png", "/icons/table.png", "/icons/down-1.png", "/icons/down-2.png"];
	permanentShelf = false;
	
	transitionAnimationTime = 150;
	transitionAnimationDistanceFactor = .015;
	
	tableViewAnimationTime = 600;
	shelfAnimationTime = 275;
	
	tableViewEasing = "cubic-bezier(.25, 1.0, .5, 1.0)";
	slideAnimateInEasing = "cubic-bezier(.4, 1.0, .7, 1.0)";
	slideAnimateOutEasing = "cubic-bezier(.1, 0.0, .2, 0.0)";
	shelfAnimateInEasing = "cubic-bezier(.4, 1.0, .7, 1.0)";
	shelfAnimateOutEasing = "cubic-bezier(.4, 0.0, .4, 1.0)";
	
	windowHeightAnimationFrames = 8;
	resizeOnTableView = false;
	
	appendHTML = "";
	
	
	
	_rootSelector = null;
	_bottomMarginElement = null;
	
	_shelfContainer = null;
	_slideShelf = null;
	_shelfMargin = 15;
	_shelfIsOpen = false;
	_shelfIsAnimating = false;
	
	_transitionAnimationDistance = 0;
	
	_startingSlide = 0;
	_numBuilds = [];
	
	_currentlyAnimating = false;
	_inTableView = false;
	
	_boundFunctions = [null, null, null, null, null];
	_maxTouches = 0;
	_currentlyTouchDevice = false;
	_lastMousemoveEvent = 0;
	
	_lastWindowHeight = window.innerHeight;
	_startWindowHeight = window.innerHeight;
	_windowHeightAnimationFrame = 0;
	_windowHeightAnimationLastTimestamp = -1;
	_resizeAnimationBound = null;
	_missedResizeAnimation = false;
	
	
	
	/*
		options =
		{
			builds: {},
			
			transitionAnimationTime: 150,
			transitionAnimationDistanceFactor: .015,
			
			tableViewAnimationTime = 600,
			shelfAnimationTime = 275,
			
			slideAnimateInEasing: "cubic-bezier(.4, 1.0, .7, 1.0)",
			slideAnimateOutEasing: "cubic-bezier(.1, 0.0, .2, 0.0)",
			shelfAnimateInEasing: "cubic-bezier(.4, 1.0, .7, 1.0)",
			shelfAnimateOutEasing: "cubic-bezier(.4, 0.0, .4, 1.0)",
			tableViewEasing: "cubic-bezier(.25, 1.0, .5, 1.0)",
			
			appendHTML: ""
			
			startingSlide: 0,
			tableViewSlidesPerScreen = 4,
			
			useShelf: true,
			permanentShelf: false,
			shelfIconPaths: ["/icons/up-2.png", "/icons/up-1.png", "/icons/table.png", "/icons/down-1.png", "/icons/down-2.png"],
			
			resizeOnTableView: false,
			windowHeightAnimationFrames: 8,
		};
	*/
	
	constructor(options)
	{
		this.callbacks = options?.builds ?? {};
		
		this.transitionAnimationTime = options?.transitionAnimationTime ?? 150;
		this.transitionAnimationDistanceFactor = options?.transitionAnimationDistanceFactor ?? .015;
		
		this.tableViewAnimationTime = options?.tableViewAnimationTime ?? 600;
		this.shelfAnimationTime = options?.shelfAnimationTime ?? 275;
		
		this.resizeOnTableView = options?.resizeOnTableView ?? false;
		this.windowHeightAnimationFrames = options?.windowHeightAnimationFrames ?? 8;
		
		this._startingSlide = options?.startingSlide ?? 0;
		this.tableViewSlidesPerScreen = options?.tableViewSlidesPerScreen ?? 4;
		
		this.useShelf = options?.useShelf ?? true;
		this.permanentShelf = options?.permanentShelf ?? false;
		this.shelfIconPaths = options?.shelfIconPaths ?? ["/icons/up-2.png", "/icons/up-1.png", "/icons/table.png", "/icons/down-1.png", "/icons/down-2.png"];
		
		this.slideAnimateInEasing = options?.slideAnimateInEasing ?? "cubic-bezier(.4, 1.0, .7, 1.0)";
		this.slideAnimateOutEasing = options?.slideAnimateOutEasing ?? "cubic-bezier(.1, 0.0, .2, 0.0)";
		this.shelfAnimateInEasing = options?.shelfAnimateInEasing ?? "cubic-bezier(.4, 1.0, .7, 1.0)";
		this.shelfAnimateOutEasing = options?.shelfAnimateOutEasing ?? "cubic-bezier(.4, 0.0, .4, 1.0)";
		this.tableViewEasing = options?.tableViewEasing ?? "cubic-bezier(.25, 1.0, .5, 1.0)";
		
		this.appendHTML = options?.appendHTML ?? "";
		
		
		
		this._rootSelector = document.querySelector(":root");
		
		this._resizeAnimationBound = this._resizeAnimation.bind(this);
		
		
		
		this.slideContainer = document.body.querySelector("#lapsa-slide-container");
		this.slideContainer.classList.add("lapsa-hover");
		
		this._bottomMarginElement = document.createElement("div");
		this._bottomMarginElement.id = "lapsa-bottom-margin";
		this.slideContainer.appendChild(this._bottomMarginElement);
		
		
		
		this.slides = document.body.querySelectorAll(".slide");
		
		this._numBuilds = new Array(this.slides.length);
		
		this.slides.forEach((element, index) =>
		{
			const wrapper = document.createElement("div");
			wrapper.classList.add("lapsa-slide-wrapper");
			
			wrapper.style.top = window.innerWidth / window.innerHeight >= 152/89 ? `calc(${index * 100 + 2.5} * var(--safe-vh))` : `calc(${index * 100} * var(--safe-vh) + (100 * var(--safe-vh) - 55.625vw) / 2)`;
			
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
				if (!this._inTableView)
				{
					return;
				}
				
				this.closeTableView(index);
			});
			
			
			
			const builds = element.querySelectorAll(".build, [data-build]");
			
			let currentBuild = 0;
			
			builds.forEach(buildElement =>
			{
				let attr = buildElement.getAttribute("data-build");
				
				if (attr === null)
				{
					buildElement.setAttribute("data-build", currentBuild);
					
					currentBuild++;
				}
				
				else
				{
					currentBuild = parseInt(attr) + 1;
				}
				
				buildElement.classList.remove("build");
			});
			
			
			
			const functionalBuildKeys = Object.keys(this.callbacks?.[element.id] ?? {});
			
			let maxFunctionalBuild = 0;
			
			functionalBuildKeys.forEach(key => maxFunctionalBuild = Math.max(maxFunctionalBuild, (parseInt(key) + 1) || 0));
			
			this._numBuilds[index] = Math.max(currentBuild, maxFunctionalBuild);
		});
		
		
		
		this._transitionAnimationDistance = window.innerWidth / window.innerHeight >= 152/89 ? window.innerHeight * this.transitionAnimationDistanceFactor * 159/82 : window.innerWidth * this.transitionAnimationDistanceFactor;
		
		this._rootSelector.style.setProperty("--safe-vh", `${window.innerHeight / 100}px`);
		
		
		
		this._shelfContainer = document.createElement("div");
		this._shelfContainer.id = "lapsa-slide-shelf-container";
		
		this._shelfContainer.innerHTML = `
			<div id="lapsa-slide-shelf" class="lapsa-hover" style="margin-left: ${this._shelfMargin}px; opacity: 0">
				<input type="image" id="lapsa-up-2-button" class="shelf-button" src="${this.shelfIconPaths[0]}">
				<input type="image" id="lapsa-up-1-button" class="shelf-button" src="${this.shelfIconPaths[1]}">
				<input type="image" id="lapsa-table-button" class="shelf-button" src="${this.shelfIconPaths[2]}">
				<input type="image" id="lapsa-down-1-button" class="shelf-button" src="${this.shelfIconPaths[3]}">
				<input type="image" id="lapsa-down-2-button" class="shelf-button" src="${this.shelfIconPaths[4]}">
			</div>
		`;
		
		document.body.appendChild(this._shelfContainer);
		
		
		
		
		
		
		
		if ("scrollRestoration" in history)
		{
			history.scrollRestoration = "manual";
		}
		
		setTimeout(() => window.scrollTo(0, 0), 10);
		
		
		
		setTimeout(() =>
		{
			this._slideShelf = document.querySelector("#lapsa-slide-shelf");
			
			if (this.permanentShelf)
			{
				this._shelfContainer.classList.add("permanent-shelf");
				this.showSlideShelf(this._slideShelf);
				this._shelfIsAnimating = false;
				this._shelfIsOpen = true;
			}
			
			else
			{
				this.hideSlideShelf(this._slideShelf, 0);
			}
			
			
			
			this._shelfContainer.addEventListener("mouseenter", () =>
			{
				if (!this._shelfIsOpen && !this.permanentShelf && this.useShelf)
				{
					this.showShelf();
				}
			});
			
			this._shelfContainer.addEventListener("mouseleave", () =>
			{
				if (this._shelfIsOpen && !this.permanentShelf && this.useShelf)
				{
					this.hideShelf();
				}
			});
			
			this._slideShelf.children[0].addEventListener("click", () =>
			{
				if (this._shelfIsOpen && !this._shelfIsAnimating)
				{
					this.previousSlide(true);
				}
			});
			
			this._slideShelf.children[1].addEventListener("click", () =>
			{
				if (this._shelfIsOpen && !this._shelfIsAnimating)
				{
					this.previousSlide();
				}
			});
			
			this._slideShelf.children[2].addEventListener("click", () =>
			{
				if (this._shelfIsOpen && !this._shelfIsAnimating)
				{
					if (this._inTableView)
					{
						this.closeTableView(this.currentSlide);
					}
					
					else
					{
						this.openTableView();
					}
				}
			});
			
			this._slideShelf.children[3].addEventListener("click", () =>
			{
				if (this._shelfIsOpen && !this._shelfIsAnimating)
				{
					this.nextSlide();
				}
			});
			
			this._slideShelf.children[4].addEventListener("click", () =>
			{
				if (this._shelfIsOpen && !this._shelfIsAnimating)
				{
					this.nextSlide(true);
				}
			});
		}, 100);
		
		
		
		document.documentElement.style.overflowY = "hidden";
		document.body.style.overflowY = "hidden";
		document.body.style.userSelect = "none";
		document.body.style.WebkitUserSelect = "none";
		
		this._boundFunctions[0] = this._handleKeydownEvent.bind(this);
		this._boundFunctions[1] = this._handleTouchstartEvent.bind(this);
		this._boundFunctions[2] = this._handleTouchendEvent.bind(this);
		this._boundFunctions[3] = this._handleMousemoveEvent.bind(this);
		this._boundFunctions[4] = this._onResize.bind(this);
		
		document.documentElement.addEventListener("keydown", this._boundFunctions[0]);
		document.documentElement.addEventListener("touchstart", this._boundFunctions[1]);
		document.documentElement.addEventListener("touchend", this._boundFunctions[2]);
		document.documentElement.addEventListener("mousemove", this._boundFunctions[3]);
		window.addEventListener("resize", this._boundFunctions[4]);
		
		setTimeout(() => this.jumpToSlide(this._startingSlide), 500);
	}
	
	
	
	exit()
	{
		this.slideContainer.remove();
		
		this.slides.forEach(element => element.remove());
		
		document.documentElement.style.overflowY = "visible";
		document.body.style.overflowY = "visible";
		document.body.style.height = "fit-content";
		document.body.style.userSelect = "auto";
		document.body.style.WebkitUserSelect = "auto";
		
		document.documentElement.removeEventListener("keydown", this._boundFunctions[0]);
		document.documentElement.removeEventListener("touchstart", this._boundFunctions[1]);
		document.documentElement.removeEventListener("touchend", this._boundFunctions[2]);
		document.documentElement.removeEventListener("mousemove", this._boundFunctions[3]);
		window.removeEventListener("resize", this._boundFunctions[4]);
	}
	
	
	
	_onResize()
	{
		if (this._currentlyAnimating)
		{
			return;
		}
		
		this._transitionAnimationDistance = window.innerWidth / window.innerHeight >= 152/89 ? window.innerHeight * this.transitionAnimationDistanceFactor * 159/82 : window.innerWidth * this.transitionAnimationDistanceFactor;
		
		
		
		if (this._inTableView)
		{
			const bodyRect = document.body.getBoundingClientRect();
			
			const slidesPerScreen = bodyRect.width / bodyRect.height >= 152/89 ? 1 : bodyRect.height / (bodyRect.width * 89/152);
			
			const scale = Math.min(slidesPerScreen / this.tableViewSlidesPerScreen, 1);
			
			const scaledSlidesPerScreen = slidesPerScreen / scale;
			
			
			
			//The first and last several slides have different animations since they can't be in the middle of the screen in the table view.
			const centerSlide = Math.min(Math.max((scaledSlidesPerScreen - 1) / 2, this.currentSlide), this.slides.length - 1 - (scaledSlidesPerScreen - 1) / 2);
			
			const translation = bodyRect.width / bodyRect.height >= 152/89 ? `calc(${(58.125 * 152/89 * centerSlide - 100 * centerSlide) * scale} * var(--safe-vh))` : `calc(${(58.125 * centerSlide) * scale}vw - ${100 * centerSlide * scale} * var(--safe-vh))`;
			
			
			
			this.slides.forEach((element, index) =>
			{
				if (window.innerWidth / window.innerHeight >= 152/89)
				{
					element.parentNode.style.top = `calc(${5 + 58.125 * 152/89 * (index - centerSlide) + 100 * centerSlide} * var(--safe-vh))`;
				}
				
				else
				{
					element.parentNode.style.top = `calc(${2.5 + 58.125 * (index - centerSlide)}vw + ${100 * centerSlide} * var(--safe-vh))`;
				}
			});
			
			if (window.innerWidth / window.innerHeight >= 152/89)
			{
				this._bottomMarginElement.style.top = `calc(${5 + 58.125 * 152/89 * (this.slides.length - centerSlide) + 100 * centerSlide} * var(--safe-vh))`;
			}
			
			else
			{
				this._bottomMarginElement.style.top = `calc(${2.5 + 58.125 * (this.slides.length - centerSlide)}vw + ${100 * centerSlide} * var(--safe-vh))`;
			}
			
			
			
			this.slideContainer.style.transform = `translateY(${translation}) scale(${scale})`;
			
			
			if (this.resizeOnTableView)
			{
				this._startWindowHeight = this._lastWindowHeight;
				this._windowHeightAnimationFrame = 1;
				window.requestAnimationFrame(this._resizeAnimationBound);
			}
			
			else
			{
				this._missedResizeAnimation = true;
			}
		}
		
		
		
		else
		{
			this._rootSelector.style.setProperty("--safe-vh", `${window.innerHeight / 100}px`);
			
			this.slides.forEach((element, index) => element.parentNode.style.top = window.innerWidth / window.innerHeight >= 152/89 ? `calc(${index * 100 + 2.5} * var(--safe-vh))` : `calc(${index * 100} * var(--safe-vh) + (100 * var(--safe-vh) - 55.625vw) / 2)`);
			
			this.slideContainer.style.transform = `translateY(calc(${-100 * this.currentSlide} * var(--safe-vh))) scale(1)`;
		}
	}
	
	
	
	_resizeAnimation(timestamp)
	{
		const timeElapsed = timestamp = this._windowHeightAnimationLastTimestamp;
		
		this._windowHeightAnimationLastTimestamp = timestamp;
		
		if (timeElapsed === 0)
		{
			return;
		}
		
		const t = .5 * (1 + Math.cos(Math.PI * (this._windowHeightAnimationFrame / this.windowHeightAnimationFrames + 1)));
		
		const newHeight = this._startWindowHeight * (1 - t) + window.innerHeight * t;
		
		this._lastWindowHeight = newHeight;
		
		
		
		this._rootSelector.style.setProperty("--safe-vh", `${newHeight / 100}px`);
		
		if (this._inTableView)
		{
			const slidesPerScreen = window.innerWidth / newHeight >= 152/89 ? 1 : newHeight / (window.innerWidth * 89/152);
			
			const scale = Math.min(slidesPerScreen / this.tableViewSlidesPerScreen, 1);
			
			const scaledSlidesPerScreen = slidesPerScreen / scale;
			
			const centerSlide = Math.min(Math.max((scaledSlidesPerScreen - 1) / 2, this.currentSlide), this.slides.length - 1 - (scaledSlidesPerScreen - 1) / 2);
			
			const translation = window.innerWidth / newHeight >= 152/89 ? `calc(${(58.125 * 152/89 * centerSlide - 100 * centerSlide) * scale} * var(--safe-vh))` : `calc(${(58.125 * centerSlide) * scale}vw - ${100 * centerSlide * scale} * var(--safe-vh))`;
			
			this.slideContainer.style.transform = `translateY(${translation}) scale(${scale})`;
		}
		
		
		
		this._windowHeightAnimationFrame++;
		
		if (this._windowHeightAnimationFrame <= this.windowHeightAnimationFrames)
		{
			window.requestAnimationFrame(this._resizeAnimationBound);
		}
	}
	
	
	
	nextSlide(skipBuilds = false)
	{
		return new Promise(async (resolve, reject) =>
		{
			if (this._currentlyAnimating || this._inTableView)
			{
				resolve();
				return;
			}
			
			this._currentlyAnimating = true;
			
			
			
			//If there's a build available, we do that instead of moving to the next slide.
			if (this.currentSlide >= 0 && !skipBuilds && this._numBuilds[this.currentSlide] !== 0 && this.buildState !== this._numBuilds[this.currentSlide])
			{
				let promises = [];
				
				//Gross code because animation durations are weird as hell -- see the corresponding previousSlide block for a better example.
				this.slides[this.currentSlide].querySelectorAll(`[data-build="${this.buildState}"]`).forEach(element =>
				{
					this.fadeUpIn(element, this.transitionAnimationTime * 2);
					
					promises.push(new Promise((resolve, reject) => setTimeout(resolve, this.transitionAnimationTime)));
				});
				
				try {promises.push(this.callbacks[this.slides[this.currentSlide].id][this.buildState](this.slides[this.currentSlide], true))}
				catch(ex) {}
				
				await Promise.all(promises);
				
				this.buildState++;
				
				this._currentlyAnimating = false;
				
				return;
			}
			
			
			
			if (this.currentSlide === this.slides.length - 1)
			{
				this._currentlyAnimating = false;
				
				return;
			}
			
			
			//Fade out the current slide, show all its builds (for the table view), then load in the next slide and hide all of its builds.
			
			await this.fadeUpOut(this.slideContainer, this.transitionAnimationTime);
			
			//Reset the slide if necessary.
			if (this.currentSlide >= 0 && this.buildState !== this._numBuilds[this.currentSlide])
			{
				try {this.callbacks[this.slides[this.currentSlide].id].reset(this.slides[this.currentSlide], true, 0)}
				catch(ex) {}
				
				this.slides[this.currentSlide].querySelectorAll("[data-build]").forEach(element => element.style.opacity = 1);
			}
			
			
			
			this.currentSlide++;
			
			this.buildState = 0;
			
			
			
			try {this.callbacks[this.slides[this.currentSlide].id].reset(this.slides[this.currentSlide], true, 0)}
			catch(ex) {}
			
			this.slides[this.currentSlide].querySelectorAll("[data-build]").forEach(element => element.style.opacity = 0);
			
			this.slideContainer.style.transform = `translateY(calc(${-100 * this.currentSlide} * var(--safe-vh))) scale(1)`;
			
			await this.fadeUpIn(this.slideContainer, this.transitionAnimationTime * 2);
			
			this._currentlyAnimating = false;
			
			resolve();
		});
	}
	
	
	
	previousSlide(skipBuilds = false)
	{
		return new Promise(async (resolve, reject) =>
		{
			if (this._currentlyAnimating || this._inTableView)
			{
				resolve();
				return;
			}
			
			this._currentlyAnimating = true;
			
			
			
			//If there's a build available, we do that instead of moving to the previous slide.
			if (!skipBuilds && this._numBuilds[this.currentSlide] !== 0 && this.buildState !== 0)
			{
				this.buildState--;
				
				let promises = [];
				
				this.slides[this.currentSlide].querySelectorAll(`[data-build="${this.buildState}"]`).forEach(element => promises.push(this.fadeDownOut(element, this.transitionAnimationTime)));
				
				try {promises.push(this.callbacks[this.slides[this.currentSlide].id][this.buildState](this.slides[this.currentSlide], false))}
				catch(ex) {}
				
				await Promise.all(promises);
				
				this._currentlyAnimating = false;
				
				return;
			}
			
			
			
			if (this.currentSlide === 0 || this.currentSlide === this.slides.length)
			{
				this._currentlyAnimating = false;
				
				return;
			}
			
			
			
			//Fade out the current slide, show all its builds (for the table view), then load in the previous slide and show all of its builds.
			
			await this.fadeDownOut(this.slideContainer, this.transitionAnimationTime);
			
			//Reset the slide if necessary.
			if (this.buildState !== this._numBuilds[this.currentSlide])
			{
				try {this.callbacks[this.slides[this.currentSlide].id].reset(this.slides[this.currentSlide], false, 0)}
				catch(ex) {}
				
				this.slides[this.currentSlide].querySelectorAll("[data-build]").forEach(element => element.style.opacity = 1);
			}
			
			
			
			this.currentSlide--;
			
			this.buildState = this._numBuilds[this.currentSlide];
			
			
			
			try {this.callbacks[this.slides[this.currentSlide].id].reset(this.slides[this.currentSlide], false, 0)}
			catch(ex) {}
			
			this.slides[this.currentSlide].querySelectorAll("[data-build]").forEach(element => element.style.opacity = 1);
			
			this.slideContainer.style.transform = `translateY(calc(${-100 * this.currentSlide} * var(--safe-vh))) scale(1)`;
			
			await this.fadeDownIn(this.slideContainer, this.transitionAnimationTime * 2);
			
			this._currentlyAnimating = false;
			
			resolve();
		});
	}
	
	
	
	jumpToSlide(index)
	{
		return new Promise(async (resolve, reject) =>
		{
			if (this._currentlyAnimating || this._inTableView)
			{
				resolve();
				return;
			}
			
			this._currentlyAnimating = true;
			
			
			
			if (index < 0 || index >= this.slides.length || index === this.currentSlide)
			{
				this._currentlyAnimating = false;
				
				resolve();
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
			
			
			
			//Reset the slide if necessary.
			if (this.currentSlide !== -1 && this.buildState !== this._numBuilds[this.currentSlide])
			{
				try {this.callbacks[this.slides[this.currentSlide].id].reset(this.slides[this.currentSlide], false, 0)}
				catch(ex) {}
				
				this.slides[this.currentSlide].querySelectorAll("[data-build]").forEach(element => element.style.opacity = 1);
			}
			
			
			
			this.currentSlide = index;
			this.buildState = 0;
			
			
			
			try {this.callbacks[this.slides[this.currentSlide].id].reset(this.slides[this.currentSlide], true, 0)}
			catch(ex) {}
			
			this.slides[this.currentSlide].querySelectorAll("[data-build]").forEach(element => element.style.opacity = 0);
			
			this.slideContainer.style.transform = `translateY(calc(${-100 * this.currentSlide} * var(--safe-vh))) scale(1)`;
			
			if (forwardAnimation)
			{
				await this.fadeUpIn(this.slideContainer, this.transitionAnimationTime * 2);
			}
			
			else
			{
				await this.fadeDownIn(this.slideContainer, this.transitionAnimationTime * 2);
			}
			
			
			
			this._currentlyAnimating = false;
			
			resolve();
		});
	}
	
	
	
	openTableView(duration = this.tableViewAnimationTime)
	{
		return new Promise((resolve, reject) =>
		{
			if (this._inTableView || this._currentlyAnimating)
			{
				resolve();
				return;
			}
			
			this._currentlyAnimating = true;
			
			
			
			if (this._currentlyTouchDevice)
			{
				this.hideShelf();
			}
			
			document.body.style.overflowY = "visible";
			document.body.style.position = "relative";
			this.slideContainer.style.overflowY = "visible";
			
			const bodyRect = document.body.getBoundingClientRect();
			
			//The goal is to have room to display just under 4 slides vertically, then center on one so that the others are clipped, indicating it's scrollable. In a horizontal orientation, exactly one slide fits per screen. In a vertical one, we take a ratio.
			const slidesPerScreen = bodyRect.width / bodyRect.height >= 152/89 ? 1 : bodyRect.height / (bodyRect.width * 89/152);
			
			const scale = Math.min(slidesPerScreen / this.tableViewSlidesPerScreen, 1);
			
			const scaledSlidesPerScreen = slidesPerScreen / scale;
			
			
			
			//The first and last two slides have different animations since they can't be in the middle of the screen in the table view.
			const centerSlide = Math.min(Math.max((scaledSlidesPerScreen - 1) / 2, this.currentSlide), this.slides.length - 1 - (scaledSlidesPerScreen - 1) / 2);
			
			this.slideContainer.style.transformOrigin = `center calc(${this.currentSlide * 100 + 50} * var(--safe-vh))`;
			
			const translation = bodyRect.width / bodyRect.height >= 152/89 ? `calc(${(58.125 * 152/89 * centerSlide - 100 * centerSlide) * scale} * var(--safe-vh))` : `calc(${(58.125 * centerSlide) * scale}vw - ${100 * centerSlide * scale} * var(--safe-vh))`;
			
			this.slideContainer.style.transition = `transform ${duration}ms ${this.tableViewEasing}`;
			
			this.slideContainer.style.transform = bodyRect.width / bodyRect.height >= 152/89 ? `translateY(calc(${(this.currentSlide - centerSlide) * 58.125 * 152/89 * scale - 100 * this.currentSlide} * var(--safe-vh))) scale(${scale})` : `translateY(calc(${(this.currentSlide - centerSlide) * 58.125 * scale}vw - ${100 * this.currentSlide} * var(--safe-vh))) scale(${scale})`;
			
			this.slides.forEach((element, index) =>
			{
				element.parentNode.style.transition = `top ${duration}ms ${this.tableViewEasing}`;
				
				//On these, we include the top margin term to match with how things were before -- otherwise, the transformation center will be misaligned.
				if (bodyRect.width / bodyRect.height >= 152/89)
				{
					element.parentNode.style.top = `calc(${58.125 * 152/89 * (index - this.currentSlide) + 100 * this.currentSlide + 2.5} * var(--safe-vh))`;
				}
				
				else
				{
					element.parentNode.style.top = `calc(${58.125 * (index - this.currentSlide)}vw + ${100 * this.currentSlide} * var(--safe-vh) + (100 * var(--safe-vh) - 55.625vw) / 2)`;
				}
			});
			
			
			
			//While all the slides are moving, we also show all builds that are currently hidden and request that the slide be reset to its final state.
			if (this.buildState !== this._numBuilds[this.currentSlide])
			{
				const builds = this.slides[this.currentSlide].querySelectorAll("[data-build]");
				const oldTransitionStyles = new Array(builds.length);
				
				builds.forEach((element, index) =>
				{
					oldTransitionStyles[index] = element.style.transition;
					
					element.style.transition = `opacity ${duration / 2}ms ${this.slideAnimateOutEasing}`;
					
					element.style.opacity = 1;
				});
				
				try {this.callbacks[this.slides[this.currentSlide].id].reset(this.slides[this.currentSlide], false, duration / 2)}
				catch(ex) {}
				
				setTimeout(() =>
				{
					builds.forEach((element, index) => element.style.transition = oldTransitionStyles[index]);
				}, duration / 2);
			}
			
			
			
			//Only once this is done can we snap to the end. They'll never know the difference!
			setTimeout(() =>
			{
				const correctTop = this.slides[this.currentSlide].getBoundingClientRect().top;
				
				this.slideContainer.style.transition = "";
				
				this.slides.forEach((element, index) =>
				{
					element.parentNode.style.transition = "";
					
					//Here, we no longer include the margin, since we don't want the slides to have a gap at the top. It's accounted for in the translation amount on the container, so it's all fine. The 5 is due to a somewhat strange effect that I don't quite understand.
					if (bodyRect.width / bodyRect.height >= 152/89)
					{
						element.parentNode.style.top = `calc(${5 + 58.125 * 152/89 * (index - centerSlide) + 100 * centerSlide} * var(--safe-vh))`;
					}
					
					else
					{
						element.parentNode.style.top = `calc(${2.5 + 58.125 * (index - centerSlide)}vw + ${100 * centerSlide} * var(--safe-vh))`;
					}
				});
				
				if (window.innerWidth / window.innerHeight >= 152/89)
				{
					this._bottomMarginElement.style.top = `calc(${5 + 58.125 * 152/89 * (this.slides.length - centerSlide) + 100 * centerSlide} * var(--safe-vh))`;
				}
				
				else
				{
					this._bottomMarginElement.style.top = `calc(${2.5 + 58.125 * (this.slides.length - centerSlide)}vw + ${100 * centerSlide} * var(--safe-vh))`;
				}
				
				
				
				this.slideContainer.style.transformOrigin = "center top";
				
				this.slideContainer.style.transform = `translateY(${translation}) scale(${scale})`;
				
				document.documentElement.style.overflowY = "visible";
				
				const newTop = this.slides[this.currentSlide].getBoundingClientRect().top;
				
				//The old way was to scroll to correctTop and get newTop at that point. If correctTop was 100 and newTop was 25, then after scrolling to position 100, newTop was 25 further, so it was 125 at first. Therefore, we want newTop - correctTop here.
				
				window.scrollTo(0, newTop - correctTop);
				
				this._currentlyAnimating = false;
				this._inTableView = true;
				this._missedResizeAnimation = false;
				this.slideContainer.classList.add("lapsa-table-view");
				
				resolve();
			}, duration);
		});
	}
	
	
	
	closeTableView(selection, duration = this.tableViewAnimationTime)
	{
		return new Promise((resolve, reject) =>
		{
			if (!this._inTableView || this._currentlyAnimating)
			{
				resolve();
				return;
			}
			
			this._currentlyAnimating = true;
			
			this.currentSlide = selection;
			
			this.slideContainer.classList.remove("lapsa-table-view");
			
			
			
			//As with opening, this is a two-step process. First we snap back to a translated version, and then we return everything to its rightful place.
			
			const bodyRect = document.body.getBoundingClientRect();
			
			//The goal is to have room to display just under 4 slides vertically, then center on one so that the others are clipped, indicating it's scrollable. In a horizontal orientation, exactly one slide fits per screen. In a vertical one, we take a ratio.
			const slidesPerScreen = bodyRect.width / bodyRect.height >= 152/89 ? 1 : bodyRect.height / (bodyRect.width * 89/152);
			
			const scale = Math.min(slidesPerScreen / this.tableViewSlidesPerScreen, 1);
			
			
			//The first and last two slides have different animations since they can't be in the middle of the screen in the table view.
			const centerSlide = Math.min(Math.max(1.25, this.currentSlide), this.slides.length - 2.25);
			
			const correctTop = this.slides[0].getBoundingClientRect().top;
			
			
			
			document.documentElement.style.overflowY = "hidden";
			document.body.style.overflowY = "hidden";
			
			this.slideContainer.style.transformOrigin = `center calc(${centerSlide * 100 + 50} * var(--safe-vh))`;
			
			
			
			this.slides.forEach((element, index) =>
			{
				//On these, we include the top margin term to match with how things were before -- otherwise, the transformation center will be misaligned.
				if (bodyRect.width / bodyRect.height >= 152/89)
				{
					element.parentNode.style.top = `calc(${58.125 * 152/89 * (index - this.currentSlide) + 100 * this.currentSlide + 2.5} * var(--safe-vh))`;
				}
				
				else
				{
					element.parentNode.style.top = `calc(${58.125 * (index - this.currentSlide)}vw + ${100 * this.currentSlide} * var(--safe-vh) + (100 * var(--safe-vh) - 55.625vw) / 2)`;
				}
			});
			
			this._bottomMarginElement.style.top = 0;
			
			
			
			this.slideContainer.style.transform = `translateY(0) scale(${scale})`;
			
			window.scrollTo(0, 0);
			
			const newTop = this.slides[0].getBoundingClientRect().top;
			
			const scroll = correctTop - newTop;
			
			this.slideContainer.style.transform = `translateY(${scroll}px) scale(${scale})`;
			
			
			
			//While all the slides are moving, we also show all builds that are currently hidden and request that the slide be reset to its final state.
			const builds = this.slides[this.currentSlide].querySelectorAll("[data-build]");
			const oldTransitionStyles = new Array(builds.length);
			
			builds.forEach((element, index) =>
			{
				oldTransitionStyles[index] = element.style.transition;
				
				element.style.transition = `opacity ${duration / 3}ms ${this.slideAnimateInEasing}`;
				
				element.style.opacity = 0;
			});
			
			try {this.callbacks[this.slides[this.currentSlide].id].reset(this.slides[this.currentSlide], true, duration / 3)}
			catch(ex) {}
			
			setTimeout(() =>
			{
				builds.forEach((element, index) => element.style.transition = oldTransitionStyles[index]);
			}, duration / 3);
			
			
			
			//Now we can return all the slides to their proper places.
			
			//Someday, I will understand why these four lines need to be the way they are. And then I will finally rest.
			this.slideContainer.style.transition = "";
			this.slideContainer.style.transform = `translateY(${scroll}px) scale(${scale})`;
			
			setTimeout(() =>
			{
				this.slideContainer.style.transition = `transform ${duration}ms ${this.tableViewEasing}`;
				this.slideContainer.style.transform = `translateY(calc(${-100 * this.currentSlide} * var(--safe-vh))) scale(1)`;
			
				
				this.slides.forEach((element, index) =>
				{
					element.parentNode.style.transition = `top ${duration}ms ${this.tableViewEasing}`;
					
					element.parentNode.style.top = window.innerWidth / window.innerHeight >= 152/89 ? `calc(${index * 100 + 2.5} * var(--safe-vh))` : `calc(${index * 100} * var(--safe-vh) + (100 * var(--safe-vh) - 55.625vw) / 2)`;
				});
				
				setTimeout(() =>
				{
					builds.forEach((element, index) => element.style.transition = oldTransitionStyles[index]);
					this.buildState = 0;
					
					this.slideContainer.style.transition = "";
					
					this.slides.forEach(element => element.parentNode.style.transition = "");
					
					this._currentlyAnimating = false;
					this._inTableView = false;
					
					document.body.style.position = "fixed";
					
					if (this._missedResizeAnimation)
					{
						this._startWindowHeight = this._lastWindowHeight;
						this._windowHeightAnimationFrame = 1;
						window.requestAnimationFrame(this._resizeAnimationBound);
					}
					
					resolve();
				}, duration);
			}, 0);
		});
	}
	
	
	
	async showShelf()
	{
		if (this.permanentShelf)
		{
			return;
		}
		
		
		
		this._shelfIsOpen = true;
		this._shelfIsAnimating = true;
		
		this._slideShelf.style.display = "";
		this._slideShelf.parentNode.style.paddingRight = "100px";
		
		
		await this.showSlideShelf(this._slideShelf);
		
		this._shelfIsAnimating = false;
	}
	
	async hideShelf()
	{
		if (this.permanentShelf)
		{
			return;
		}
		
		
		
		this._shelfIsOpen = false;
		this._shelfIsAnimating = true;
		
		this._slideShelf.parentNode.style.paddingRight = "0";
		
		await this.hideSlideShelf(this._slideShelf);
		
		this._shelfIsAnimating = false;
	}
	
	showSlideShelf(element, duration = this.shelfAnimationTime)
	{
		return new Promise((resolve, reject) =>
		{
			const oldTransitionStyle = element.style.transition;
			element.style.transition = `margin-left ${duration}ms ${this.shelfAnimateInEasing}, opacity ${duration}ms ${this.shelfAnimateInEasing}`;
			
			element.style.marginLeft = `${this._shelfMargin}px`;
			element.style.opacity = 1;
			
			setTimeout(() =>
			{
				element.style.transition = oldTransitionStyle;
				resolve();
			}, duration);
		});
	}
	
	hideSlideShelf(element, duration = this.shelfAnimationTime)
	{
		return new Promise((resolve, reject) =>
		{
			const oldTransitionStyle = element.style.transition;
			element.style.transition = `margin-left ${duration}ms ${this.shelfAnimateOutEasing}, opacity ${duration}ms ${this.shelfAnimateOutEasing}`;
			
			element.style.marginLeft = `${-this._shelfMargin}px`;
			element.style.opacity = 0;
			
			setTimeout(() =>
			{
				element.style.transition = oldTransitionStyle;
				resolve();
			}, duration);
		});	
	}
	
	
	
	_handleKeydownEvent(e)
	{
		if (e.keyCode === 39 || e.keyCode === 40 || e.keyCode === 32 || e.keyCode === 13)
		{
			this.nextSlide();
		}
		
		else if (e.keyCode === 37 || e.keyCode === 38)
		{
			this.previousSlide();
		}
	}
	
	_handleTouchstartEvent(e)
	{
		this._maxTouches = Math.max(this._maxTouches, e.touches.length);
		
		this._currentlyTouchDevice = true;
		this._slideShelf.classList.remove("lapsa-hover");
		this.slideContainer.classList.remove("lapsa-hover");
	}
	
	_handleTouchendEvent(e)
	{
		if (this._maxTouches === 2)
		{
			this.nextSlide();
		}
		
		else if (this._maxTouches === 3 && !this._shelfIsAnimating)
		{
			if (!this._shelfIsOpen)
			{
				this.showShelf();
			}
			
			else
			{
				this.hideShelf();
			}
		}
		
		this._maxTouches = 0;
		
		setTimeout(() => this._slideShelf.classList.remove("lapsa-hover"), 50);
		setTimeout(() => this.slideContainer.classList.remove("lapsa-hover"), 50);
	}
	
	_handleMousemoveEvent(e)
	{
		if (this._currentlyTouchDevice)
		{
			const timeBetweenMousemoves = Date.now() - this._lastMousemoveEvent;
			
			this._lastMousemoveEvent = Date.now();
			
			//Checking if it's >= 3 kinda sucks, but it seems like touch devices like to fire two mousemoves in quick succession sometimes. They also like to make that delay exactly 33. Look, I hate this too, but it needs to be here.
			if (timeBetweenMousemoves >= 3 && timeBetweenMousemoves <= 50 && timeBetweenMousemoves !== 33)
			{
				this._currentlyTouchDevice = false;
				this._slideShelf.classList.add("lapsa-hover");
				this.slideContainer.classList.add("lapsa-hover");
			}
		}
	}
	
	
	
	fadeUpIn(element, duration)
	{
		return new Promise((resolve, reject) =>
		{
			element.style.marginTop = `${this._transitionAnimationDistance}px`;
			
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
	
	fadeUpOut(element, duration)
	{
		return new Promise((resolve, reject) =>
		{
			const oldTransitionStyle = element.style.transition;
			element.style.transition = `margin-top ${duration}ms ${this.slideAnimateOutEasing}, opacity ${duration}ms ${this.slideAnimateOutEasing}`;
			
			element.style.marginTop = `${-this._transitionAnimationDistance}px`;
			element.style.opacity = 0;
			
			setTimeout(() =>
			{
				element.style.transition = oldTransitionStyle;
				resolve();
			}, duration);
		});
	}
	
	fadeDownIn(element, duration)
	{
		return new Promise((resolve, reject) =>
		{
			element.style.marginTop = `${-this._transitionAnimationDistance}px`;
			
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
	
	fadeDownOut(element, duration)
	{
		return new Promise((resolve, reject) =>
		{
			const oldTransitionStyle = element.style.transition;
			element.style.transition = `margin-top ${duration}ms ${this.slideAnimateOutEasing}, opacity ${duration}ms ${this.slideAnimateOutEasing}`;
			
			element.style.marginTop = `${this._transitionAnimationDistance}px`;
			element.style.opacity = 0;
			
			setTimeout(() =>
			{
				element.style.transition = oldTransitionStyle;
				resolve();
			}, duration);
		});
	}
}