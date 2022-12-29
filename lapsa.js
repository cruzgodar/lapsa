class Lapsa
{
	callbacks = {};
	slides = [];
	currentSlide = -1;
	
	shelfMargin = 50;
	shelfIconPaths = ["/icons/up-2.png", "/icons/up-1.png", "/icons/table.png", "/icons/down-1.png", "/icons/down-2.png"];
	
	transitionAnimationTime = 150;
	transitionAnimationDistanceFactor = .015;
	
	tableViewEasing = "cubic-bezier(.25, 1.0, .5, 1.0)";
	
	
	
	_slideContainer = null;
	_bottomMarginElement = null;
	
	_shelfContainer = null;
	_slideShelf = null;
	_shelfIsOpen = false;
	_shelfIsAnimating = false;
	
	_transitionAnimationDistance = 0;
	
	_buildState = 0;
	_numBuilds = [];
	
	_currentlyAnimating = false;
	_inTableView = false;
	
	_boundFunctions = [null, null, null, null, null];
	_maxTouches = 0;
	_currentlyTouchDevice = false;
    _lastMousemoveEvent = 0;
	
	
	
	/*
		options =
		{
			callbacks: {}
		};
	*/
	
	constructor(options)
	{
		this.callbacks = options?.callbacks ?? {};
		
		this.slides = document.body.querySelectorAll(".slide");
		
		this._numBuilds = new Array(this.slides.length);
		
		this.slides.forEach((element, index) =>
		{
			element.style.top = window.innerWidth / window.innerHeight >= 152/89 ? `calc(${index * 100}vh + (100vh - 55.625vh * 152 / 89) / 2)` : `calc(${index * 100}vh + (100vh - 55.625vw) / 2)`;
			
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
			});
			
			this._numBuilds[index] = Math.max(currentBuild, this.callbacks?.[element.id]?.builds?.length ?? 0);
		});
		
		this._slideContainer = document.body.querySelector("#lapsa-slide-container");
		this._slideContainer.classList.add("lapsa-hover");
		
		this._bottomMarginElement = document.createElement("div");
		this._bottomMarginElement.id = "lapsa-bottom-margin";
		this._slideContainer.appendChild(this._bottomMarginElement);
		
		
		
		this._transitionAnimationDistance = window.innerWidth / window.innerHeight >= 152/89 ? window.innerHeight * this.transitionAnimationDistanceFactor * 159/82 : window.innerWidth * this.transitionAnimationDistanceFactor;
		
		
		
		this._shelfContainer = document.createElement("div");
		this._shelfContainer.id = "lapsa-slide-shelf-container";
		
		this._shelfContainer.innerHTML = `
			<div id="lapsa-slide-shelf" class="lapsa-hover" style="margin-left: ${this.shelfMargin}px; opacity: 0">
				<input type="image" id="lapsa-up-2-button" class="shelf-button" src="${this.shelfIconPaths[0]}">
				<input type="image" id="lapsa-up-1-button" class="shelf-button" src="${this.shelfIconPaths[1]}">
				<input type="image" id="lapsa-table-button" class="shelf-button" src="${this.shelfIconPaths[2]}">
				<input type="image" id="lapsa-down-1-button" class="shelf-button" src="${this.shelfIconPaths[3]}">
				<input type="image" id="lapsa-down-2-button" class="shelf-button" src="${this.shelfIconPaths[4]}">
			</div>
		`;
		
		document.body.appendChild(this._shelfContainer);
		
		//document.body.style.height = `${window.innerHeight}px`;
		//this._slideContainer.style.height = `${window.innerHeight}px`;
		
		
		
		if ("scrollRestoration" in history)
		{
			history.scrollRestoration = "manual";
		}
		
		setTimeout(() => window.scrollTo(0, 0), 10);
		
		
		
		setTimeout(() =>
		{
			this._slideShelf = document.querySelector("#lapsa-slide-shelf");
			this._slideShelf.style.display = "none";
			this.hideSlideShelf(this._slideShelf, 0);
			
			this._shelfContainer.addEventListener("mouseenter", () =>
			{
				if (!this._shelfIsOpen)
				{
					this.showShelf();
				}
			});
			
			this._shelfContainer.addEventListener("mouseleave", () =>
			{
				if (this._shelfIsOpen)
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
		this._boundFunctions[4] = this.onResize.bind(this);
		
		document.documentElement.addEventListener("keydown", this._boundFunctions[0]);
		document.documentElement.addEventListener("touchstart", this._boundFunctions[1]);
		document.documentElement.addEventListener("touchend", this._boundFunctions[2]);
		document.documentElement.addEventListener("mousemove", this._boundFunctions[3]);
		window.addEventListener("resize", this._boundFunctions[4]);
		
		this.nextSlide();
	}
	
	
	
	exit()
	{
		this._slideContainer.remove();
		
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
	
	
	
	onResize()
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
			
			const scale = Math.min(slidesPerScreen / 3.5, 1);
			
			const scaledSlidesPerScreen = slidesPerScreen / scale;
			
			
			
			//The first and last two slides have different animations since they can't be in the middle of the screen in the table view.
			const centerSlide = Math.min(Math.max((scaledSlidesPerScreen - 1) / 2, this.currentSlide), this.slides.length - 1 - (scaledSlidesPerScreen - 1) / 2);
			
			const translation = bodyRect.width / bodyRect.height >= 152/89 ? `${(58.125 * 152/89 * centerSlide - 100 * centerSlide) * scale}vh` : `calc(${(58.125 * centerSlide) * scale}vw - ${100 * centerSlide * scale}vh)`;
			
			
			
			this.slides.forEach((element, index) =>
			{
				if (window.innerWidth / window.innerHeight >= 152/89)
				{
					element.style.top = `calc(${5 + 58.125 * 152/89 * (index - centerSlide) + 100 * centerSlide}vh)`;
				}
				
				else
				{
					element.style.top = `calc(${2.5 + 58.125 * (index - centerSlide)}vw + ${100 * centerSlide}vh)`;
				}
			});
			
			if (window.innerWidth / window.innerHeight >= 152/89)
			{
				this._bottomMarginElement.style.top = `calc(${5 + 58.125 * 152/89 * (this.slides.length - centerSlide) + 100 * centerSlide}vh)`;
			}
			
			else
			{
				this._bottomMarginElement.style.top = `calc(${2.5 + 58.125 * (this.slides.length - centerSlide)}vw + ${100 * centerSlide}vh)`;
			}
			
			
			
			this._slideContainer.style.transform = `translateY(${translation}) scale(${scale})`;
			
			window.scrollTo(0, 0);
		}
		
		
		
		else
		{
			this.slides.forEach((element, index) => element.style.top = window.innerWidth / window.innerHeight >= 152/89 ? `calc(${index * 100}vh + (100vh - 55.625vh * 152 / 89) / 2)` : `calc(${index * 100}vh + (100vh - 55.625vw) / 2)`);
			
			this._slideContainer.style.transform = `translateY(${-100 * this.currentSlide}vh) scale(1)`;
		}
	}
	
	
	
	nextSlide(skipBuilds = false)
	{
		return new Promise(async (resolve, reject) =>
		{
			if (this._currentlyAnimating || this._inTableView)
			{
				reject();
				return;
			}
			
			this._currentlyAnimating = true;
			
			
			//If there's a build available, we do that instead of moving to the next slide.
			if (this.currentSlide >= 0 && !skipBuilds && this._numBuilds[this.currentSlide] !== 0 && this._buildState !== this._numBuilds[this.currentSlide])
			{
				let promises = [];
				
				//Gross code because animation durations are weird as hell -- see the corresponding previousSlide block for a better example.
				this.slides[this.currentSlide].querySelectorAll(`[data-build="${this._buildState}"]`).forEach(element =>
				{
					this.fadeUpIn(element, this.transitionAnimationTime * 2);
					
					promises.push(new Promise((resolve, reject) => setTimeout(resolve, this.transitionAnimationTime)));
				});
				
				try {promises.push(this.callbacks[this.slides[this.currentSlide].id].builds[this._buildState](this.slides[this.currentSlide], true))}
				catch(ex) {}
				
				await Promise.all(promises);
				
				this._buildState++;
				
				this._currentlyAnimating = false;
				
				return;
			}
			
			
			
			if (this.currentSlide === this.slides.length - 1)
			{
				this._currentlyAnimating = false;
				
				return;
			}
			
			
			//Fade out the current slide, show all its builds (for the table view), then load in the next slide and hide all of its builds.
			
			await this.fadeUpOut(this._slideContainer, this.transitionAnimationTime);
			
			//Reset the slide if necessary.
			if (this.currentSlide >= 0 && this._buildState !== this._numBuilds[this.currentSlide])
			{
				try {await this.callbacks[this.slides[this.currentSlide].id].reset(this.slides[this.currentSlide], true, 0)}
				catch(ex) {}
				
				this.slides[this.currentSlide].querySelectorAll("[data-build]").forEach(element => element.style.opacity = 1);
			}
			
			
			
			this.currentSlide++;
			
			this._buildState = 0;
			
			
			
			try {await this.callbacks[this.slides[this.currentSlide].id].reset(this.slides[this.currentSlide], true)}
			catch(ex) {}
			
			this.slides[this.currentSlide].querySelectorAll("[data-build]").forEach(element => element.style.opacity = 0);
			
			this._slideContainer.style.transform = `translateY(${-100 * this.currentSlide}vh) scale(1)`;
			
			await this.fadeUpIn(this._slideContainer, this.transitionAnimationTime * 2);
			
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
				reject();
				return;
			}
			
			this._currentlyAnimating = true;
			
			
			
			//If there's a build available, we do that instead of moving to the previous slide.
			if (!skipBuilds && this._numBuilds[this.currentSlide] !== 0 && this._buildState !== 0)
			{
				this._buildState--;
				
				let promises = [];
				
				this.slides[this.currentSlide].querySelectorAll(`[data-build="${this._buildState}"]`).forEach(element => promises.push(this.fadeDownOut(element, this.transitionAnimationTime)));
				
				try {promises.push(this.callbacks[this.slides[this.currentSlide].id].builds[this._buildState](this.slides[this.currentSlide], false))}
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
			
			await this.fadeDownOut(this._slideContainer, this.transitionAnimationTime);
			
			//Reset the slide if necessary.
			if (this._buildState !== this._numBuilds[this.currentSlide])
			{
				try {await this.callbacks[this.slides[this.currentSlide].id].reset(this.slides[this.currentSlide], false, 0)}
				catch(ex) {}
				
				this.slides[this.currentSlide].querySelectorAll("[data-build]").forEach(element => element.style.opacity = 1);
			}
			
			
			
			this.currentSlide--;
			
			this._buildState = this._numBuilds[this.currentSlide];
			
			
			
			try {await this.callbacks[this.slides[this.currentSlide].id].reset(this.slides[this.currentSlide], false, 0)}
			catch(ex) {}
			
			this.slides[this.currentSlide].querySelectorAll("[data-build]").forEach(element => element.style.opacity = 1);
			
			this._slideContainer.style.transform = `translateY(${-100 * this.currentSlide}vh) scale(1)`;
			
			await this.fadeDownIn(this._slideContainer, this.transitionAnimationTime * 2);
			
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
				reject();
				return;
			}
			
			this._currentlyAnimating = true;
			
			
			
			if (index < 0 || index >= this.slides.length || index === this.currentSlide)
			{
				this._currentlyAnimating = false;
				
				reject();
				return;
			}
			
			
			
			const forwardAnimation = index > this.currentSlide;
			
			if (forwardAnimation)
			{
				await this.fadeUpOut(this._slideContainer, this.transitionAnimationTime);
			}
			
			else
			{
				await this.fadeDownOut(this._slideContainer, this.transitionAnimationTime);
			}
			
			
			
			//Reset the slide if necessary.
			if (this._buildState !== this._numBuilds[this.currentSlide])
			{
				try {await this.callbacks[this.slides[this.currentSlide].id].reset(this.slides[this.currentSlide], false, 0)}
				catch(ex) {}
				
				this.slides[this.currentSlide].querySelectorAll("[data-build]").forEach(element => element.style.opacity = 1);
			}
			
			
			
			this.currentSlide = index;
			this._buildState = 0;
			
			
			
			try {await this.callbacks[this.slides[this.currentSlide].id].reset(this.slides[this.currentSlide], true, 0)}
			catch(ex) {}
			
			this.slides[this.currentSlide].querySelectorAll("[data-build]").forEach(element => element.style.opacity = 0);
			
			this._slideContainer.style.transform = `translateY(${-100 * this.currentSlide}vh) scale(1)`;
			
			if (forwardAnimation)
			{
				await this.fadeUpIn(this._slideContainer, this.transitionAnimationTime * 2);
			}
			
			else
			{
				await this.fadeDownIn(this._slideContainer, this.transitionAnimationTime * 2);
			}
			
			this._currentlyAnimating = false;
			
			resolve();
		});
	}
	
	
	
	openTableView(duration = 600)
	{
		return new Promise((resolve, reject) =>
		{
			if (this._inTableView || this._currentlyAnimating)
			{
				reject();
				return;
			}
			
			
			
			document.body.style.overflowY = "visible";
			this._slideContainer.style.overflowY = "visible";
			
			this._currentlyAnimating = true;
			
			const bodyRect = document.body.getBoundingClientRect();
			
			//The goal is to have room to display just under 4 slides vertically, then center on one so that the others are clipped, indicating it's scrollable. In a horizontal orientation, exactly one slide fits per screen. In a vertical one, we take a ratio.
			const slidesPerScreen = bodyRect.width / bodyRect.height >= 152/89 ? 1 : bodyRect.height / (bodyRect.width * 89/152);
			
			const scale = Math.min(slidesPerScreen / 3.5, 1);
			
			const scaledSlidesPerScreen = slidesPerScreen / scale;
			
			
			
			//The first and last two slides have different animations since they can't be in the middle of the screen in the table view.
			const centerSlide = Math.min(Math.max((scaledSlidesPerScreen - 1) / 2, this.currentSlide), this.slides.length - 1 - (scaledSlidesPerScreen - 1) / 2);
			
			this._slideContainer.style.transformOrigin = `center ${this.currentSlide * 100 + 50}vh`;
			
			const translation = bodyRect.width / bodyRect.height >= 152/89 ? `${(58.125 * 152/89 * centerSlide - 100 * centerSlide) * scale}vh` : `calc(${(58.125 * centerSlide) * scale}vw - ${100 * centerSlide * scale}vh)`;
			
			this._slideContainer.style.transition = `transform ${duration}ms ${this.tableViewEasing}`;
			
			this._slideContainer.style.transform = bodyRect.width / bodyRect.height >= 152/89 ? `translateY(${(this.currentSlide - centerSlide) * 58.125 * 152/89 * scale - 100 * this.currentSlide}vh) scale(${scale})` : `translateY(calc(${(this.currentSlide - centerSlide) * 58.125 * scale}vw - ${100 * this.currentSlide}vh)) scale(${scale})`;
			
			this.slides.forEach((element, index) =>
			{
				element.style.transition = `top ${duration}ms ${this.tableViewEasing}`;
				
				//On these, we include the top margin term to match with how things were before -- otherwise, the transformation center will be misaligned.
				if (bodyRect.width / bodyRect.height >= 152/89)
				{
					element.style.top = `${58.125 * 152/89 * (index - this.currentSlide) + 100 * this.currentSlide + 2.5}vh`;
				}
				
				else
				{
					element.style.top = `calc(${58.125 * (index - this.currentSlide)}vw + ${100 * this.currentSlide}vh + (100vh - 55.625vw) / 2)`;
				}
			});
			
			
			
			//Only once this is done can we snap to the end. They'll never know the difference!
			setTimeout(() =>
			{
				const correctTop = this.slides[this.currentSlide].getBoundingClientRect().top;
				
				this._slideContainer.style.transition = "";
				
				this.slides.forEach((element, index) =>
				{
					element.style.transition = "";
					
					//Here, we no longer include the margin, since we don't want the slides to have a gap at the top. It's accounted for in the translation amount on the container, so it's all fine. The 5 is due to a somewhat strange effect that I don't quite understand.
					if (bodyRect.width / bodyRect.height >= 152/89)
					{
						element.style.top = `calc(${5 + 58.125 * 152/89 * (index - centerSlide) + 100 * centerSlide}vh)`;
					}
					
					else
					{
						element.style.top = `calc(${2.5 + 58.125 * (index - centerSlide)}vw + ${100 * centerSlide}vh)`;
					}
				});
				
				if (window.innerWidth / window.innerHeight >= 152/89)
				{
					this._bottomMarginElement.style.top = `calc(${5 + 58.125 * 152/89 * (this.slides.length - centerSlide) + 100 * centerSlide}vh)`;
				}
				
				else
				{
					this._bottomMarginElement.style.top = `calc(${2.5 + 58.125 * (this.slides.length - centerSlide)}vw + ${100 * centerSlide}vh)`;
				}
				
				
				
				this._slideContainer.style.transformOrigin = "center top";
				
				this._slideContainer.style.transform = `translateY(${translation}) scale(${scale})`;
				
				window.scrollTo(0, 0);
				
				const newTop = this.slides[this.currentSlide].getBoundingClientRect().top;
				const scroll = newTop - correctTop;
				
				window.scrollTo(0, scroll);
				
				document.documentElement.style.overflowY = "visible";
				
				this._currentlyAnimating = false;
				this._inTableView = true;
				this._slideContainer.classList.add("lapsa-table-view");
				
				resolve();
			}, duration);
		});
	}
	
	
	
	closeTableView(selection, duration = 600)
	{
		return new Promise((resolve, reject) =>
		{
			if (!this._inTableView || this._currentlyAnimating)
			{
				reject();
				return;
			}
			
			this._currentlyAnimating = true;
			
			this.currentSlide = selection;
			
			this._slideContainer.classList.remove("lapsa-table-view");
			
			
			
			//As with opening, this is a two-step process. First we snap back to a translated version, and then we return everything to its rightful place.
			
			const bodyRect = document.body.getBoundingClientRect();
			
			//The goal is to have room to display just under 4 slides vertically, then center on one so that the others are clipped, indicating it's scrollable. In a horizontal orientation, exactly one slide fits per screen. In a vertical one, we take a ratio.
			const slidesPerScreen = bodyRect.width / bodyRect.height >= 152/89 ? 1 : bodyRect.height / (bodyRect.width * 89/152);
			
			const scale = Math.min(slidesPerScreen / 3.5, 1);
			
			
			//The first and last two slides have different animations since they can't be in the middle of the screen in the table view.
			const centerSlide = Math.min(Math.max(1.25, this.currentSlide), this.slides.length - 2.25);
			
			const correctTop = this.slides[0].getBoundingClientRect().top;
			
			
			
			document.documentElement.style.overflowY = "hidden";
			document.body.style.overflowY = "hidden";
			
			this._slideContainer.style.transformOrigin = `center ${centerSlide * 100 + 50}vh`;
			
			
			
			this.slides.forEach((element, index) =>
			{
				//On these, we include the top margin term to match with how things were before -- otherwise, the transformation center will be misaligned.
				if (bodyRect.width / bodyRect.height >= 152/89)
				{
					element.style.top = `${58.125 * 152/89 * (index - this.currentSlide) + 100 * this.currentSlide + 2.5}vh`;
				}
				
				else
				{
					element.style.top = `calc(${58.125 * (index - this.currentSlide)}vw + ${100 * this.currentSlide}vh + (100vh - 55.625vw) / 2)`;
				}
			});
			
			this._bottomMarginElement.style.top = 0;
			
			
			
			this._slideContainer.style.transform = `translateY(0) scale(${scale})`;
			
			window.scrollTo(0, 0);
			
			const newTop = this.slides[0].getBoundingClientRect().top;
			
			const scroll = correctTop - newTop;
			
			this._slideContainer.style.transform = `translateY(${scroll}px) scale(${scale})`;
			
			
			
			//Now we can return all the slides to their proper places.
			
			//Someday, I will understand why these four lines need to be the way they are. And then I will finally rest.
			this._slideContainer.style.transition = "";
			this._slideContainer.style.transform = `translateY(${scroll}px) scale(${scale})`;
			
			setTimeout(() =>
			{
				this._slideContainer.style.transition = `transform ${duration}ms ${this.tableViewEasing}`;
				this._slideContainer.style.transform = `translateY(${-100 * this.currentSlide}vh) scale(1)`;
			
				
				this.slides.forEach((element, index) =>
				{
					element.style.transition = `top ${duration}ms ${this.tableViewEasing}`;
					
					element.style.top = window.innerWidth / window.innerHeight >= 152/89 ? `${index * 100 + 2.5}vh` : `calc(${index * 100}vh + (100vh - 55.625vw) / 2)`;
				});
				
				
				
				setTimeout(() =>
				{
					this._slideContainer.style.transition = "";
					
					this.slides.forEach(element => element.style.transition = "");
					
					this._currentlyAnimating = false;
					this._inTableView = false;
					
					resolve();
				}, duration);
			}, 0);
		});
	}
	
	
	
	async showShelf()
	{
		this._shelfIsOpen = true;
		this._shelfIsAnimating = true;
		
		this._slideShelf.style.display = "";
		
		await this.showSlideShelf(this._slideShelf, 275);
		
		this._shelfIsAnimating = false;
	}
	
	async hideShelf()
	{
		this._shelfIsOpen = false;
		this._shelfIsAnimating = true;
		
		await this.hideSlideShelf(this._slideShelf, 275);
		
		this._shelfIsAnimating = false;
	}
	
	showSlideShelf(element, duration)
	{
		return new Promise((resolve, reject) =>
		{
			anime({
				targets: element,
				marginLeft: "0px",
				opacity: 1,
				duration: duration,
				easing: "cubicBezier(.4, 1.0, .7, 1.0)",
				complete: resolve
			});
		});
	}
	
	hideSlideShelf(element, duration)
	{
		return new Promise((resolve, reject) =>
		{
			anime({
				targets: element,
				marginLeft: `${-this.shelfMargin}px`,
				opacity: 0,
				duration: duration,
				easing: "cubicBezier(.4, 0.0, .4, 1.0)",
				complete: resolve
			});
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
		this._slideContainer.classList.remove("lapsa-hover");
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
		setTimeout(() => this._slideContainer.classList.remove("lapsa-hover"), 50);
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
				this._slideContainer.classList.add("lapsa-hover");
			}
		}
	}
	
	
	
	fadeUpIn(element, duration)
	{
		return new Promise((resolve, reject) =>
		{
			element.style.marginTop = `${this._transitionAnimationDistance}px`;
			
			anime({
				targets: element,
				marginTop: "0px",
				opacity: 1,
				duration: duration,
				easing: "cubicBezier(.4, 1.0, .7, 1.0)",
				complete: resolve
			});
		});
	}
	
	fadeUpOut(element, duration)
	{
		return new Promise((resolve, reject) =>
		{
			anime({
				targets: element,
				marginTop: `${-this._transitionAnimationDistance}px`,
				opacity: 0,
				duration: duration,
				easing: "cubicBezier(.1, 0.0, .2, 0.0)",
				complete: resolve
			});
		});
	}
	
	fadeDownIn(element, duration)
	{
		return new Promise((resolve, reject) =>
		{
			element.style.marginTop = `${-this._transitionAnimationDistance}px`;
			
			anime({
				targets: element,
				marginTop: "0px",
				opacity: 1,
				duration: duration,
				easing: "cubicBezier(.4, 1.0, .7, 1.0)",
				complete: resolve
			});
		});
	}
	
	fadeDownOut(element, duration)
	{
		return new Promise((resolve, reject) =>
		{
			anime({
				targets: element,
				marginTop: `${this._transitionAnimationDistance}px`,
				opacity: 0,
				duration: duration,
				easing: "cubicBezier(.1, 0.0, .2, 0.0)",
				complete: resolve
			});
		});
	}
}