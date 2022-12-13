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
	
	currentSlide = 0;
	
	buildState = 0;
	numBuilds = 0;
	
	currentlyAnimating = false;
	
	
	
	/*
		options =
		{
			callbacks: {}
		};
	*/
	
	constructor(options)
	{
		this.init(options.callbacks ?? {});
	}
	
	
	
	init(callbacks)
	{
		this.callbacks = callbacks;
		
		this.slides = document.body.querySelectorAll(".slide");
		this.slideContainer = document.body.querySelector("#slide-container");
		
		
		
		this.slideShelfContainer = document.createElement("div");
		this.slideShelfContainer.id = "slide-shelf-container";
		
		this.slideShelfContainer.innerHTML = `
			<div id="slide-shelf" style="margin-left: ${this.shelfMargin}px; opacity: 0">
				<input type="image" id="lapsa-up-2-button" class="shelf-button" src="${this.shelfIconPaths[0]}">
				<input type="image" id="lapsa-up-1-button" class="shelf-button" src="${this.shelfIconPaths[1]}">
				<input type="image" id="lapsa-down-1-button" class="shelf-button" src="${this.shelfIconPaths[0]}">
				<input type="image" id="lapsa-down-2-button" class="shelf-button" src="${this.shelfIconPaths[0]}">
			</div>
		`;
		
		console.log("hi!");
		
		document.body.appendChild(this.slideShelfContainer);
		
		setTimeout(() =>
		{
			this.slideShelf = document.querySelector("#slide-shelf");
			this.slideShelf.style.display = "none";
			Page.Animate.hideSlideShelf(this.slideShelf, 0);
			
			document.body.querySelectorAll(".shelf-button").forEach(element => Page.Load.HoverEvents.add(element));
			
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
			
			this.slideShelfContainer.children[0].addEventListener("click", () => this.previousSlide(true));
			this.slideShelfContainer.children[1].addEventListener("click", () => this.previousSlide());
			this.slideShelfContainer.children[2].addEventListener("click", () => this.nextSlide());
			this.slideShelfContainer.children[3].addEventListener("click", () => this.nextSlide(true));
		}, 50);
		
		
		
		this.slides.forEach(element => element.style.display = "none");
		
		document.body.querySelectorAll("header, footer").forEach(element => element.style.display = "none");
		
		Page.element.firstElementChild.style.display = "none";
		
		document.documentElement.style.overflowY = "hidden";
		document.body.style.overflowY = "hidden";
		document.body.style.userSelect = "none";
		document.body.style.WebkitUserSelect = "none";
		
		
		
		Page.Load.HoverEvents.add(document.body.querySelector("#help-link"));
		
		
		
		document.body.querySelectorAll("h1, h2").forEach(element => element.parentNode.insertAdjacentHTML("afterend", "<br>"));
		
		
		
		document.documentElement.addEventListener("keydown", this.handleKeydownEvent);
		Page.temporary_handlers["keydown"].push(this.handleKeydownEvent);
		
		document.documentElement.addEventListener("touchstart", this.handleTouchstartEvent);
		Page.temporary_handlers["touchstart"].push(this.handleTouchstartEvent);
		
		document.documentElement.addEventListener("touchend", this.handleTouchendEvent);
		Page.temporary_handlers["touchend"].push(this.handleTouchendEvent);
		
		
		
		this.nextSlide();
	}
	
	
	
	exit()
	{
		this.slideContainer.remove();
		
		this.slides.forEach(element => element.remove());
		
		document.body.querySelectorAll("header, footer").forEach(element => element.style.display = "block");
	
		Page.element.firstElementChild.style.display = "block";
		
		document.documentElement.style.overflowY = "visible";
		document.body.style.overflowY = "visible";
		document.body.style.userSelect = "auto";
		document.body.style.WebkitUserSelect = "auto";
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
			
			//Gross code because animation durations are weird as hell -- see the corresponding previous_slide block for a better example.
			this.slides[this.currentSlide].querySelectorAll(`.build-${this.buildState}`).forEach(element =>
			{
				Page.Animate.fadeUpIn(element, Site.pageAnimationTime * 2);
				
				promises.push(new Promise((resolve, reject) => setTimeout(resolve, Site.pageAnimationTime)));
			});
			
			try {promises.push(this.callbacks[this.slides[this.currentSlide].id].builds[this.buildState](this.slides[this.currentSlide], true))}
			catch(ex) {}
			
			await Promise.all(promises);
			
			this.buildState++;
			
			this.currentlyAnimating = false;
			
			return;
		}
		
		
		
		if (this.currentSlide === this.slides.length)
		{
			this.currentlyAnimating = false;
			
			return;
		}
		
		await Page.Animate.fadeUpOut(Page.element, Site.pageAnimationTime);
		
		if (this.currentSlide !== -1)
		{
			this.slides[this.currentSlide].style.display = "none";
		}
		
		this.currentSlide++;
		
		if (this.currentSlide === this.slides.length)
		{
			this.exit();
		}
		
		else
		{
			this.slides[this.currentSlide].style.display = "block";
			
			this.buildState = 0;
			
			const builds = this.slides[this.currentSlide].querySelectorAll(".build");
			
			this.numBuilds = Math.max(builds.length, this.callbacks?.[this.slides[this.currentSlide].id]?.builds?.length ?? 0);
			
			builds.forEach(element => element.style.opacity = 0);
		}
		
		try {await this.callbacks[this.slides[this.currentSlide].id].callback(this.slides[this.currentSlide], true)}
		catch(ex) {}
		
		await Page.Animate.fadeUpIn(Page.element, Site.pageAnimationTime * 2);
		
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
			
			this.slides[this.currentSlide].querySelectorAll(`.build-${this.buildState}`).forEach(element => promises.push(Page.Animate.fadeDownOut(element, Site.pageAnimationTime)));
			
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
		
		
		
		await Page.Animate.fadeDownOut(Page.element, Site.pageAnimationTime);
		
		this.slides[this.currentSlide].style.display = "none";
		
		
		
		this.currentSlide--;
		
		const builds = this.slides[this.currentSlide].querySelectorAll(".build");
		
		this.numBuilds = Math.max(builds.length, this.callbacks?.[this.slides[this.currentSlide].id]?.builds?.length ?? 0);
		
		this.buildState = this.numBuilds;
		
		builds.forEach(element => element.style.opacity = 1);
		
		
		
		this.slides[this.currentSlide].style.display = "block";
		
		try {await this.callbacks[this.slides[this.currentSlide].id].callback(this.slides[this.currentSlide], false)}
		catch(ex) {}
		
		await Page.Animate.fadeDownIn(Page.element, Site.pageAnimationTime * 2);
		
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
			await Page.Animate.fadeUpOut(Page.element, Site.pageAnimationTime);
		}
		
		else
		{
			await Page.Animate.fadeDownOut(Page.element, Site.pageAnimationTime);
		}
		
		
		
		this.slides[this.currentSlide].style.display = "none";
		
		this.currentSlide = index;
		
		this.slides[this.currentSlide].style.display = "block";
		
		
		
		this.buildState = 0;
		
		const builds = this.slides[this.currentSlide].querySelectorAll(".build");
		
		this.numBuilds = Math.max(builds.length, this.callbacks?.[this.slides[this.currentSlide].id]?.builds?.length ?? 0);
		
		builds.forEach(element => element.style.opacity = 0);
		
		
		
		try {await this.callbacks[this.slides[this.currentSlide].id].callback(this.slides[this.currentSlide], true)}
		catch(ex) {}
		
		
		
		if (forwardAnimation)
		{
			await Page.Animate.fadeUpIn(Page.element, Site.pageAnimationTime * 2);
		}
		
		else
		{
			await Page.Animate.fadeDownIn(Page.element, Site.pageAnimationTime * 2);
		}
		
		this.currentlyAnimating = false;
	}
	
	
	
	async showShelf()
	{
		this.shelfIsOpen = true;
		this.shelfIsAnimating = true;
		
		this.slideShelf.style.display = "";
		
		await Page.Animate.showSlideShelf(this.slideShelf, 275);
		
		this.shelfIsAnimating = false;
	}
	
	async hideShelf()
	{
		this.shelfIsOpen = false;
		this.shelfIsAnimating = true;
		
		await Page.Animate.hideSlideShelf(this.slideShelf, 275);
		
		this.shelfIsAnimating = false;
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
	
	
	
	handleKeydownEvent(e)
	{
		if (e.keyCode === 39 || e.keyCode === 40 || e.keyCode === 32 || e.keyCode === 13)
		{
			Page.Presentation.nextSlide();
		}
		
		else if (e.keyCode === 37 || e.keyCode === 38)
		{
			Page.Presentation.previousSlide();
		}
	}
	
	
	
	maxTouches = 0;
	
	handleTouchstartEvent(e)
	{
		Page.Presentation.maxTouches = Math.max(Page.Presentation.maxTouches, e.touches.length);
	}
	
	handleTouchendEvent(e)
	{
		if (Page.Presentation.maxTouches === 2)
		{
			Page.Presentation.nextSlide();
		}
		
		else if (Page.Presentation.maxTouches === 3 && !Page.Presentation.shelfIsAnimating)
		{
			if (!Page.Presentation.shelfIsOpen)
			{
				Page.Presentation.showShelf();
			}
			
			else
			{
				Page.Presentation.hideShelf();
			}
		}
		
		Page.Presentation.maxTouches = 0;
	}
	
	
	
	getCurrentSlide()
	{
		return this.slides[this.currentSlide];
	}
}