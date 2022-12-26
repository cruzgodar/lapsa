class Lapsa
{
	callbacks = {};
	
	slides = [];
	slideContainer = null;
	
	slideShelfContainer = null;
	slideShelf = null;
	shelfIsOpen = false;
	shelfIsAnimating = false;
	shelfMargin = 50;
	shelfIconPaths = ["/icons/up-2.png", "/icons/up-1.png", "/icons/down-1.png", "/icons/down-2.png"];
	
	currentSlide = -1;
	transitionAnimationTime = 150;
	
	buildState = 0;
	numBuilds = 0;
	
	currentlyAnimating = false;
	
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
		});
		
		this.slideContainer = document.body.querySelector("#lapsa-slide-container");
		
		this.slideShelfContainer = document.createElement("div");
		this.slideShelfContainer.id = "lapsa-slide-shelf-container";
		
		this.slideShelfContainer.innerHTML = `
			<div id="lapsa-slide-shelf" class="lapsa-hover" style="margin-left: ${this.shelfMargin}px; opacity: 0">
				<input type="image" id="lapsa-up-2-button" class="shelf-button" src="${this.shelfIconPaths[0]}">
				<input type="image" id="lapsa-up-1-button" class="shelf-button" src="${this.shelfIconPaths[1]}">
				<input type="image" id="lapsa-down-1-button" class="shelf-button" src="${this.shelfIconPaths[2]}">
				<input type="image" id="lapsa-down-2-button" class="shelf-button" src="${this.shelfIconPaths[3]}">
			</div>
		`;
		
		document.body.appendChild(this.slideShelfContainer);
		
		
		
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
			
			this.slideShelf.children[0].addEventListener("click", () => this.previousSlide(true));
			this.slideShelf.children[1].addEventListener("click", () => this.previousSlide());
			this.slideShelf.children[2].addEventListener("click", () => this.nextSlide());
			this.slideShelf.children[3].addEventListener("click", () => this.nextSlide(true));
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
	
	
	
	async nextSlide(skipBuilds = false)
	{
		if (this.currentlyAnimating)
		{
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
		
		if (this.currentSlide === this.slides.length)
		{
			//this.exit();
		}
		
		else
		{
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
		}
		
		try {await this.callbacks[this.slides[this.currentSlide].id].callback(this.slides[this.currentSlide], true)}
		catch(ex) {}
		
		await this.fadeUpIn(this.slideContainer, this.transitionAnimationTime * 2);
		
		this.currentlyAnimating = false;
	}
	
	
	
	async previousSlide(skipBuilds = false)
	{
		if (this.currentlyAnimating)
		{
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
	}
	
	
	
	async jumpToSlide(index)
	{
		if (this.currentlyAnimating)
		{
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
	}
	
	
	
	async openTableView(duration)
	{
		return new Promise((resolve, reject) =>
		{
			document.documentElement.style.overflowY = "visible";
			document.body.style.overflowY = "visible";
			this.slideContainer.style.overflowY = "visible";
			
			this.slideContainer.style.transformOrigin = `center ${this.currentSlide * 100 + 50}vh`;
			this.slideContainer.style.transformOrigin = `center top`;
			
			//The goal is to have room to display just under 4 slides vertically, then center on one so that the others are clipped, indicating it's scrollable. In a horizontal orientation, exactly one slide fits per screen. In a vertical one, we take a ratio.
			const slides_per_screen = window.innerWidth / window.innerHeight >= 152/89 ? 1 : window.innerHeight / (window.innerWidth * 89/152);
			
			const scale = Math.min(slides_per_screen / 3.5, 1);
			
			const margin = window.innerWidth / window.innerHeight >= 152/89 ? "calc(1.25vh * 152 / 89)" : "1.25vw";
			
			//Approximately 72vh per slide above?
			//The goal at this point is to move the translation so that the top slide is aligned with the top of the viewport. If we do nothing, the current slide will be centered, so the top of the top slide is 50vh - (58.125vx * (currentSlide + 1/2)) * scale. I *think* this explains why the correction offset for slide 3 is almost exactly 250vh. Regardless, we want that expression to vanish, so we translate by the opposite of it.
			const translation = window.innerWidth / window.innerHeight >= 152/89 ? `${(58.125 * 152/89 * this.currentSlide - 100 * this.currentSlide) * scale}vh` : `calc(${(58.125 * this.currentSlide) * scale}vw - ${100 * this.currentSlide * scale}vh)`;
			
			const total_height = window.innerWidth / window.innerHeight >= 152/89 ? `calc((58.125vh * ${this.slides.length} + 1.25vh) * 152 / 89)` : `calc(58.125vw * ${this.slides.length} + 1.25vw)`;
			
			//Once we've scaled down to the new amount, we can figure out where our slide is going to go and track it with the viewport.
			//const target_scroll = window.innerWidth / window.innerHeight >= 152/89 ? window.innerHeight * .58125 * scale * 152/89 * (this.currentSlide - 1.25) : window.innerWidth * .58125 * scale * (this.currentSlide - 1.25);
			/*
			anime({
				targets: this.slideContainer,
				scale: scale,
				translateY: translation,
				duration: duration,
				easing: "cubicBezier(.25, 1.0, .5, 1.0)",
				
				complete: () =>
				{
					this.slideContainer.style.height = total_height;
					resolve();
				}
			});
			*/
			
			this.slideContainer.style.transition = `transform ${duration}ms cubic-bezier(.25, 1.0, .5, 1.0)`;
			
			this.slideContainer.style.transform = `translateY(${translation}) scale(${scale})`;
			
			this.slides.forEach((element, index) =>
			{
				element.style.transition = `top ${duration}ms cubic-bezier(.25, 1.0, .5, 1.0)`;
				
				if (window.innerWidth / window.innerHeight >= 152/89)
				{
					element.style.top = `${2.5 + 58.125 * 152/89 * (index - this.currentSlide) + 100 * this.currentSlide}vh`;
				}
				
				else
				{
					element.style.top = `calc(${2.5 + 58.125 * (index - this.currentSlide)}vw + ${100 * this.currentSlide}vh)`;
				}
			});
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