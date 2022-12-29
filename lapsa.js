class Lapsa
{
	callbacks = {};
	
	slides = [];
	slideContainer = null;
	bottomMarginElement = null;
	
	slideShelfContainer = null;
	slideShelf = null;
	shelfIsOpen = false;
	shelfIsAnimating = false;
	shelfMargin = 50;
	shelfIconPaths = ["/icons/up-2.png", "/icons/up-1.png", "/icons/table.png", "/icons/down-1.png", "/icons/down-2.png"];
	
	currentSlide = -1;
	transitionAnimationTime = 150;
	
	buildState = 0;
	numBuilds = 0;
	
	currentlyAnimating = false;
	inTableView = false;
	
	tableViewEasing = "cubic-bezier(.25, 1.0, .5, 1.0)";
	
	boundFunctions = [null, null, null, null];
	
	
	
	/*
		options =
		{
			callbacks: {}
		};
	*/
	
	constructor(options)
	{
		this.init(options?.callbacks ?? {});
	}
	
	
	
	init(callbacks)
	{
		this.callbacks = callbacks;
		
		this.slides = document.body.querySelectorAll(".slide");
		
		this.slides.forEach((element, index) =>
		{
			element.style.top = window.innerWidth / window.innerHeight >= 152/89 ? `calc(${index * 100}vh + (100vh - 55.625vh * 152 / 89) / 2)` : `calc(${index * 100}vh + (100vh - 55.625vw) / 2)`;
			
			element.addEventListener("click", () =>
			{
				if (!this.inTableView)
				{
					return;
				}
				
				this.closeTableView(index);
			});
		});
		
		this.slideContainer = document.body.querySelector("#lapsa-slide-container");
		this.slideContainer.classList.add("lapsa-hover");
		
		this.bottomMarginElement = document.createElement("div");
		this.bottomMarginElement.id = "lapsa-bottom-margin";
		this.slideContainer.appendChild(this.bottomMarginElement);
		
		
		
		this.slideShelfContainer = document.createElement("div");
		this.slideShelfContainer.id = "lapsa-slide-shelf-container";
		
		this.slideShelfContainer.innerHTML = `
			<div id="lapsa-slide-shelf" class="lapsa-hover" style="margin-left: ${this.shelfMargin}px; opacity: 0">
				<input type="image" id="lapsa-up-2-button" class="shelf-button" src="${this.shelfIconPaths[0]}">
				<input type="image" id="lapsa-up-1-button" class="shelf-button" src="${this.shelfIconPaths[1]}">
				<input type="image" id="lapsa-table-button" class="shelf-button" src="${this.shelfIconPaths[2]}">
				<input type="image" id="lapsa-down-1-button" class="shelf-button" src="${this.shelfIconPaths[3]}">
				<input type="image" id="lapsa-down-2-button" class="shelf-button" src="${this.shelfIconPaths[4]}">
			</div>
		`;
		
		document.body.appendChild(this.slideShelfContainer);
		
		//document.body.style.height = `${window.innerHeight}px`;
		//this.slideContainer.style.height = `${window.innerHeight}px`;
		
		
		
		if ("scrollRestoration" in history)
		{
			history.scrollRestoration = "manual";
		}
		
		setTimeout(() => window.scrollTo(0, 0), 10);
		
		
		
		setTimeout(() =>
		{
			this.slideShelf = document.querySelector("#lapsa-slide-shelf");
			this.slideShelf.style.display = "none";
			this.hideSlideShelf(this.slideShelf, 0);
			
			this.slideShelfContainer.addEventListener("mouseenter", () =>
			{
				if (!this.shelfIsOpen)
				{
					this.showShelf();
				}
			});
			
			this.slideShelfContainer.addEventListener("mouseleave", () =>
			{
				if (this.shelfIsOpen)
				{
					this.hideShelf();
				}
			});
			
			this.slideShelf.children[0].addEventListener("click", () =>
			{
				if (this.shelfIsOpen && !this.shelfIsAnimating)
				{
					this.previousSlide(true);
				}
			});
			
			this.slideShelf.children[1].addEventListener("click", () =>
			{
				if (this.shelfIsOpen && !this.shelfIsAnimating)
				{
					this.previousSlide();
				}
			});
			
			this.slideShelf.children[2].addEventListener("click", () =>
			{
				if (this.shelfIsOpen && !this.shelfIsAnimating)
				{
					if (this.inTableView)
					{
						this.closeTableView(this.currentSlide);
					}
					
					else
					{
						this.openTableView();
					}
				}
			});
			
			this.slideShelf.children[3].addEventListener("click", () =>
			{
				if (this.shelfIsOpen && !this.shelfIsAnimating)
				{
					this.nextSlide();
				}
			});
			
			this.slideShelf.children[4].addEventListener("click", () =>
			{
				if (this.shelfIsOpen && !this.shelfIsAnimating)
				{
					this.nextSlide(true);
				}
			});
		}, 100);
		
		
		
		document.documentElement.style.overflowY = "hidden";
		document.body.style.overflowY = "hidden";
		document.body.style.userSelect = "none";
		document.body.style.WebkitUserSelect = "none";
		
		this.boundFunctions[0] = this.handleKeydownEvent.bind(this);
		this.boundFunctions[1] = this.handleTouchstartEvent.bind(this);
		this.boundFunctions[2] = this.handleTouchendEvent.bind(this);
		this.boundFunctions[3] = this.handleMousemoveEvent.bind(this);
		
		document.documentElement.addEventListener("keydown", this.boundFunctions[0]);
		document.documentElement.addEventListener("touchstart", this.boundFunctions[1]);
		document.documentElement.addEventListener("touchend", this.boundFunctions[2]);
		document.documentElement.addEventListener("mousemove", this.boundFunctions[3]);
		
		this.nextSlide();
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
		
		document.documentElement.removeEventListener("keydown", this.boundFunctions[0]);
		document.documentElement.removeEventListener("touchstart", this.boundFunctions[1]);
		document.documentElement.removeEventListener("touchend", this.boundFunctions[2]);
		document.documentElement.removeEventListener("mousemove", this.boundFunctions[3]);
	}
	
	
	
	nextSlide(skipBuilds = false)
	{
		return new Promise(async (resolve, reject) =>
		{
			if (this.currentlyAnimating || this.inTableView)
			{
				resolve();
				return;
			}
			
			this.currentlyAnimating = true;
			
			if (!skipBuilds && this.numBuilds !== 0 && this.buildState !== this.numBuilds)
			{
				let promises = [];
				
				//Gross code because animation durations are weird as hell -- see the corresponding previousSlide block for a better example.
				this.slides[this.currentSlide].querySelectorAll(`[data-build="${this.buildState}"]`).forEach(element =>
				{
					this.fadeUpIn(element, this.transitionAnimationTime * 2);
					
					promises.push(new Promise((resolve, reject) => setTimeout(resolve, this.transitionAnimationTime)));
				});
				
				try {promises.push(this.callbacks[this.slides[this.currentSlide].id].builds[this.buildState](this.slides[this.currentSlide], true))}
				catch(ex) {}
				
				await Promise.all(promises);
				
				this.buildState++;
				
				this.currentlyAnimating = false;
				
				return;
			}
			
			if (this.currentSlide === this.slides.length - 1)
			{
				this.currentlyAnimating = false;
				
				return;
			}
			
			await this.fadeUpOut(this.slideContainer, this.transitionAnimationTime);
			
			this.currentSlide++;
			
			this.slideContainer.style.transform = `translateY(${-100 * this.currentSlide}vh) scale(1)`;
			
			this.buildState = 0;
			
			const builds = this.slides[this.currentSlide].querySelectorAll(".build, [data-build]");
			
			let currentBuild = 0;
			
			builds.forEach(element =>
			{
				element.style.opacity = 0;
				
				let attr = element.getAttribute("data-build");
				
				if (attr === null)
				{
					element.setAttribute("data-build", currentBuild);
					
					currentBuild++;
				}
				
				else
				{
					currentBuild = parseInt(attr) + 1;
				}
			});
			
			this.numBuilds = Math.max(currentBuild, this.callbacks?.[this.slides[this.currentSlide].id]?.builds?.length ?? 0);
			
			try {await this.callbacks[this.slides[this.currentSlide].id].callback(this.slides[this.currentSlide], true)}
			catch(ex) {}
			
			await this.fadeUpIn(this.slideContainer, this.transitionAnimationTime * 2);
			
			this.currentlyAnimating = false;
			
			resolve();
		});
	}
	
	
	
	previousSlide(skipBuilds = false)
	{
		return new Promise(async (resolve, reject) =>
		{
			if (this.currentlyAnimating || this.inTableView)
			{
				resolve();
				return;
			}
			
			this.currentlyAnimating = true;
			
			
			
			if (!skipBuilds && this.numBuilds !== 0 && this.buildState !== 0)
			{
				this.buildState--;
				
				let promises = [];
				
				this.slides[this.currentSlide].querySelectorAll(`[data-build="${this.buildState}"]`).forEach(element => promises.push(this.fadeDownOut(element, this.transitionAnimationTime)));
				
				try {promises.push(this.callbacks[this.slides[this.currentSlide].id].builds[this.buildState](this.slides[this.currentSlide], false))}
				catch(ex) {}
				
				await Promise.all(promises);
				
				this.currentlyAnimating = false;
				
				return;
			}
			
			
			
			if (this.currentSlide === 0 || this.currentSlide === this.slides.length)
			{
				this.currentlyAnimating = false;
				
				return;
			}
			
			
			
			await this.fadeDownOut(this.slideContainer, this.transitionAnimationTime);
			
			this.currentSlide--;
			
			this.slideContainer.style.transform = `translateY(${-100 * this.currentSlide}vh) scale(1)`;
			
			
			
			const builds = this.slides[this.currentSlide].querySelectorAll(".build, [data-build]");
			
			let currentBuild = 0;
			
			builds.forEach(element =>
			{
				element.style.opacity = 1;
				
				let attr = element.getAttribute("data-build");
				
				if (attr === null)
				{
					element.setAttribute("data-build", currentBuild);
					
					currentBuild++;
				}
				
				else
				{
					currentBuild = parseInt(attr) + 1;
				}
			});
			
			this.numBuilds = Math.max(currentBuild, this.callbacks?.[this.slides[this.currentSlide].id]?.builds?.length ?? 0);
			
			this.buildState = this.numBuilds;
			
			
			
			try {await this.callbacks[this.slides[this.currentSlide].id].callback(this.slides[this.currentSlide], false)}
			catch(ex) {}
			
			await this.fadeDownIn(this.slideContainer, this.transitionAnimationTime * 2);
			
			this.currentlyAnimating = false;
			
			resolve();
		});
	}
	
	
	
	jumpToSlide(index)
	{
		return new Promise(async (resolve, reject) =>
		{
			if (this.currentlyAnimating || this.inTableView)
			{
				resolve();
				return;
			}
			
			this.currentlyAnimating = true;
			
			
			
			if (index < 0 || index >= this.slides.length || index === this.currentSlide)
			{
				this.currentlyAnimating = false;
				
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
			
			
			
			this.currentSlide = index;
			
			this.slideContainer.style.transform = `translateY(${-100 * this.currentSlide}vh) scale(1)`;
			
			
			
			this.buildState = 0;
			
			const builds = this.slides[this.currentSlide].querySelectorAll(".build, [data-build]");
			
			let currentBuild = 0;
			
			builds.forEach(element =>
			{
				element.style.opacity = 0;
				
				let attr = element.getAttribute("data-build");
				
				if (attr === null)
				{
					element.setAttribute("data-build", currentBuild);
					
					currentBuild++;
				}
				
				else
				{
					currentBuild = parseInt(attr) + 1;
				}
			});
			
			this.numBuilds = Math.max(currentBuild, this.callbacks?.[this.slides[this.currentSlide].id]?.builds?.length ?? 0);
			
			
			
			try {await this.callbacks[this.slides[this.currentSlide].id].callback(this.slides[this.currentSlide], true)}
			catch(ex) {}
			
			
			
			if (forwardAnimation)
			{
				await this.fadeUpIn(this.slideContainer, this.transitionAnimationTime * 2);
			}
			
			else
			{
				await this.fadeDownIn(this.slideContainer, this.transitionAnimationTime * 2);
			}
			
			this.currentlyAnimating = false;
			
			resolve();
		});
	}
	
	
	
	openTableView(duration = 600)
	{
		return new Promise((resolve, reject) =>
		{
			if (this.inTableView || this.currentlyAnimating)
			{
				resolve();
				return;
			}
			
			
			
			document.body.style.overflowY = "visible";
			this.slideContainer.style.overflowY = "visible";
			
			this.currentlyAnimating = true;
			
			const bodyRect = document.body.getBoundingClientRect();
			
			//The goal is to have room to display just under 4 slides vertically, then center on one so that the others are clipped, indicating it's scrollable. In a horizontal orientation, exactly one slide fits per screen. In a vertical one, we take a ratio.
			const slidesPerScreen = bodyRect.width / bodyRect.height >= 152/89 ? 1 : bodyRect.height / (bodyRect.width * 89/152);
			
			const scale = Math.min(slidesPerScreen / 3.5, 1);
			
			const scaledSlidesPerScreen = slidesPerScreen / scale;
			
			
			
			//The first and last two slides have different animations since they can't be in the middle of the screen in the table view.
			const centerSlide = Math.min(Math.max((scaledSlidesPerScreen - 1) / 2, this.currentSlide), this.slides.length - 1 - (scaledSlidesPerScreen - 1) / 2);
			
			this.slideContainer.style.transformOrigin = `center ${this.currentSlide * 100 + 50}vh`;
			
			const translation = bodyRect.width / bodyRect.height >= 152/89 ? `${(58.125 * 152/89 * centerSlide - 100 * centerSlide) * scale}vh` : `calc(${(58.125 * centerSlide) * scale}vw - ${100 * centerSlide * scale}vh)`;
			
			this.slideContainer.style.transition = `transform ${duration}ms ${this.tableViewEasing}`;
			
			this.slideContainer.style.transform = bodyRect.width / bodyRect.height >= 152/89 ? `translateY(${(this.currentSlide - centerSlide) * 58.125 * 152/89 * scale - 100 * this.currentSlide}vh) scale(${scale})` : `translateY(calc(${(this.currentSlide - centerSlide) * 58.125 * scale}vw - ${100 * this.currentSlide}vh)) scale(${scale})`;
			
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
				
				this.slideContainer.style.transition = "";
				
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
					this.bottomMarginElement.style.top = `calc(${5 + 58.125 * 152/89 * (this.slides.length - centerSlide) + 100 * centerSlide}vh)`;
				}
				
				else
				{
					this.bottomMarginElement.style.top = `calc(${2.5 + 58.125 * (this.slides.length - centerSlide)}vw + ${100 * centerSlide}vh)`;
				}
				
				
				
				this.slideContainer.style.transformOrigin = "center top";
				
				this.slideContainer.style.transform = `translateY(${translation}) scale(${scale})`;
				
				window.scrollTo(0, 0);
				
				const newTop = this.slides[this.currentSlide].getBoundingClientRect().top;
				const scroll = newTop - correctTop;
				
				window.scrollTo(0, scroll);
				
				document.documentElement.style.overflowY = "visible";
				
				this.currentlyAnimating = false;
				this.inTableView = true;
				this.slideContainer.classList.add("lapsa-table-view");
				
				resolve();
			}, duration);
		});
	}
	
	
	
	closeTableView(selection, duration = 600)
	{
		return new Promise((resolve, reject) =>
		{
			if (!this.inTableView || this.currentlyAnimating)
			{
				resolve();
				return;
			}
			
			this.currentlyAnimating = true;
			
			this.currentSlide = selection;
			
			this.slideContainer.classList.remove("lapsa-table-view");
			
			
			
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
			
			this.slideContainer.style.transformOrigin = `center ${centerSlide * 100 + 50}vh`;
			
			
			
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
			
			this.bottomMarginElement.style.top = 0;
			
			
			
			this.slideContainer.style.transform = `translateY(0) scale(${scale})`;
			
			window.scrollTo(0, 0);
			
			const newTop = this.slides[0].getBoundingClientRect().top;
			
			const scroll = correctTop - newTop;
			
			this.slideContainer.style.transform = `translateY(${scroll}px) scale(${scale})`;
			
			
			
			//Now we can return all the slides to their proper places.
			
			//Someday, I will understand why these four lines need to be the way they are. And then I will finally rest.
			this.slideContainer.style.transition = "";
			this.slideContainer.style.transform = `translateY(${scroll}px) scale(${scale})`;
			
			setTimeout(() =>
			{
				this.slideContainer.style.transition = `transform ${duration}ms ${this.tableViewEasing}`;
				this.slideContainer.style.transform = `translateY(${-100 * this.currentSlide}vh) scale(1)`;
			
				
				this.slides.forEach((element, index) =>
				{
					element.style.transition = `top ${duration}ms ${this.tableViewEasing}`;
					
					element.style.top = window.innerWidth / window.innerHeight >= 152/89 ? `${index * 100 + 2.5}vh` : `calc(${index * 100}vh + (100vh - 55.625vw) / 2)`;
				});
				
				
				
				setTimeout(() =>
				{
					this.slideContainer.style.transition = "";
					
					this.slides.forEach(element => element.style.transition = "");
					
					this.currentlyAnimating = false;
					this.inTableView = false;
					
					resolve();
				}, duration);
			}, 0);
		});
	}
	
	
	
	async showShelf()
	{
		this.shelfIsOpen = true;
		this.shelfIsAnimating = true;
		
		this.slideShelf.style.display = "";
		
		await this.showSlideShelf(this.slideShelf, 275);
		
		this.shelfIsAnimating = false;
	}
	
	async hideShelf()
	{
		this.shelfIsOpen = false;
		this.shelfIsAnimating = true;
		
		await this.hideSlideShelf(this.slideShelf, 275);
		
		this.shelfIsAnimating = false;
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
	
	
	
	handleKeydownEvent(e)
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
	
	
	
	maxTouches = 0;
	currentlyTouchDevice = false;
    lastMousemoveEvent = 0;
	
	handleTouchstartEvent(e)
	{
		this.maxTouches = Math.max(this.maxTouches, e.touches.length);
		
		this.currentlyTouchDevice = true;
		this.slideShelf.classList.remove("lapsa-hover");
		this.slideContainer.classList.remove("lapsa-hover");
	}
	
	handleTouchendEvent(e)
	{
		if (this.maxTouches === 2)
		{
			this.nextSlide();
		}
		
		else if (this.maxTouches === 3 && !this.shelfIsAnimating)
		{
			if (!this.shelfIsOpen)
			{
				this.showShelf();
			}
			
			else
			{
				this.hideShelf();
			}
		}
		
		this.maxTouches = 0;
		
		setTimeout(() => this.slideShelf.classList.remove("lapsa-hover"), 50);
		setTimeout(() => this.slideContainer.classList.remove("lapsa-hover"), 50);
	}
	
	handleMousemoveEvent(e)
	{
		if (this.currentlyTouchDevice)
		{
			const timeBetweenMousemoves = Date.now() - this.lastMousemoveEvent;
			
			this.lastMousemoveEvent = Date.now();
			
			//Checking if it's >= 3 kinda sucks, but it seems like touch devices like to fire two mousemoves in quick succession sometimes. They also like to make that delay exactly 33. Look, I hate this too, but it needs to be here.
			if (timeBetweenMousemoves >= 3 && timeBetweenMousemoves <= 50 && timeBetweenMousemoves !== 33)
			{
				this.currentlyTouchDevice = false;
				this.slideShelf.classList.add("lapsa-hover");
				this.slideContainer.classList.add("lapsa-hover");
			}
		}
	}
	
	
	
	getCurrentSlide()
	{
		return this.slides[this.currentSlide];
	}
	
	
	
	fadeUpIn(element, duration)
	{
		return new Promise((resolve, reject) =>
		{
			element.style.marginTop = `${window.innerHeight / 40}px`;
			
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
				marginTop: `${-window.innerHeight / 40}px`,
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
			element.style.marginTop = `${-window.innerHeight / 40}px`;
			
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
				marginTop: `${window.innerHeight / 40}px`,
				opacity: 0,
				duration: duration,
				easing: "cubicBezier(.1, 0.0, .2, 0.0)",
				complete: resolve
			});
		});
	}
}