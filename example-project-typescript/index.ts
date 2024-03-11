import Lapsa, { BuildFunction, SlideBuilds } from "/lapsa.es.js";

const rootElement = document.querySelector<HTMLElement>(":root");

if (!rootElement)
{
	throw new Error("Root element does not exist");
}

const themeDemonstrationSlideBuilds: SlideBuilds =
{
	reset: function(slide, forward, duration)
	{
		return new Promise(resolve =>
		{
			if (lapsa.buildState >= 3 && lapsa.buildState <= 5)
			{
				rootElement.style.setProperty("--theme-transition-time", `${duration}ms`);
				
				document.documentElement.classList.add("theme-transition");
				lapsa.slideContainer.classList.add("theme-transition");
				
				setTimeout(() =>
				{
					document.documentElement.classList.remove("dark-industrial-theme-1");
					lapsa.slideContainer.classList.remove("dark-industrial-theme-1");
					
					document.documentElement.classList.remove("blue-whimsical-theme-1");
					lapsa.slideContainer.classList.remove("blue-whimsical-theme-1");
					
					document.documentElement.classList.remove("dark-futuristic-theme-1");
					lapsa.slideContainer.classList.remove("dark-futuristic-theme-1");
					
					lapsa.slideContainer.classList.add("theme-opacity-change");
					
					setTimeout(() =>
					{
						lapsa.slideContainer.classList.remove("theme-opacity-change");
						lapsa.slideContainer.classList.remove("dark-industrial-theme-2");
						lapsa.slideContainer.classList.remove("blue-whimsical-theme-2");
						lapsa.slideContainer.classList.remove("dark-futuristic-theme-2");
					}, duration / 2);
				}, 0);
			}
			
			setTimeout(() =>
			{
				document.documentElement.classList.remove("theme-transition");
				lapsa.slideContainer.classList.remove("theme-transition");
				
				resolve();
			}, duration);
		});
	},

	2: function(slide, forward, duration = 300)
	{
		return new Promise<void>(resolve =>
		{
			rootElement.style.setProperty("--theme-transition-time", `${duration}ms`);
			
			document.documentElement.classList.add("theme-transition");
			lapsa.slideContainer.classList.add("theme-transition");
			
			setTimeout(() =>
			{
				if (forward)
				{
					document.documentElement.classList.add("dark-industrial-theme-1");
					lapsa.slideContainer.classList.add("dark-industrial-theme-1");
					
					lapsa.slideContainer.classList.add("theme-opacity-change");
					
					setTimeout(() =>
					{
						lapsa.slideContainer.classList.add("dark-industrial-theme-2");
						lapsa.slideContainer.classList.remove("theme-opacity-change");
					}, duration / 2);
				}
				
				else
				{
					document.documentElement.classList.remove("dark-industrial-theme-1");
					lapsa.slideContainer.classList.remove("dark-industrial-theme-1");
					
					lapsa.slideContainer.classList.add("theme-opacity-change");
					
					setTimeout(() =>
					{
						lapsa.slideContainer.classList.remove("dark-industrial-theme-2");
						lapsa.slideContainer.classList.remove("theme-opacity-change");
					}, duration / 2);
				}
			}, 0);
			
			setTimeout(() =>
			{
				document.documentElement.classList.remove("theme-transition");
				lapsa.slideContainer.classList.remove("theme-transition");
				
				resolve();
			}, duration);
		});
	} as BuildFunction,

	3: function(slide, forward, duration = 300)
	{
		return new Promise((resolve, reject) =>
		{
			rootElement.style.setProperty("--theme-transition-time", `${duration}ms`);
			
			document.documentElement.classList.add("theme-transition");
			lapsa.slideContainer.classList.add("theme-transition");
			
			setTimeout(() =>
			{
				if (forward)
				{
					document.documentElement.classList.remove("dark-industrial-theme-1");
					lapsa.slideContainer.classList.remove("dark-industrial-theme-1");
					
					document.documentElement.classList.add("blue-whimsical-theme-1");
					lapsa.slideContainer.classList.add("blue-whimsical-theme-1");
					
					lapsa.slideContainer.classList.add("theme-opacity-change");
					
					setTimeout(() =>
					{
						lapsa.slideContainer.classList.remove("dark-industrial-theme-2");
						lapsa.slideContainer.classList.add("blue-whimsical-theme-2");
						lapsa.slideContainer.classList.remove("theme-opacity-change");
					}, duration / 2);
				}
				
				else
				{
					document.documentElement.classList.remove("blue-whimsical-theme-1");
					lapsa.slideContainer.classList.remove("blue-whimsical-theme-1");
					
					document.documentElement.classList.add("dark-industrial-theme-1");
					lapsa.slideContainer.classList.add("dark-industrial-theme-1");
					
					lapsa.slideContainer.classList.add("theme-opacity-change");
					
					setTimeout(() =>
					{
						lapsa.slideContainer.classList.remove("blue-whimsical-theme-2");
						lapsa.slideContainer.classList.add("dark-industrial-theme-2");
						
						lapsa.slideContainer.classList.remove("theme-opacity-change");
					}, duration / 2);
				}
			}, 0);
			
			setTimeout(() =>
			{
				document.documentElement.classList.remove("theme-transition");
				lapsa.slideContainer.classList.remove("theme-transition");
				
				resolve();
			}, duration);
		});
	} as BuildFunction,
	
	
	
	4: function(slide, forward, duration = 300)
	{
		return new Promise((resolve, reject) =>
		{
			rootElement.style.setProperty("--theme-transition-time", `${duration}ms`);
			
			document.documentElement.classList.add("theme-transition");
			lapsa.slideContainer.classList.add("theme-transition");
			
			setTimeout(() =>
			{
				if (forward)
				{
					document.documentElement.classList.remove("blue-whimsical-theme-1");
					lapsa.slideContainer.classList.remove("blue-whimsical-theme-1");
					
					document.documentElement.classList.add("dark-futuristic-theme-1");
					lapsa.slideContainer.classList.add("dark-futuristic-theme-1");
					
					lapsa.slideContainer.classList.add("theme-opacity-change");
					
					setTimeout(() =>
					{
						lapsa.slideContainer.classList.remove("blue-whimsical-theme-2");
						lapsa.slideContainer.classList.add("dark-futuristic-theme-2");
						lapsa.slideContainer.classList.remove("theme-opacity-change");
					}, duration / 2);
				}
				
				else
				{
					document.documentElement.classList.remove("dark-futuristic-theme-1");
					lapsa.slideContainer.classList.remove("dark-futuristic-theme-1");
					
					document.documentElement.classList.add("blue-whimsical-theme-1");
					lapsa.slideContainer.classList.add("blue-whimsical-theme-1");
					
					lapsa.slideContainer.classList.add("theme-opacity-change");
					
					setTimeout(() =>
					{
						lapsa.slideContainer.classList.remove("dark-futuristic-theme-2");
						lapsa.slideContainer.classList.add("blue-whimsical-theme-2");
						
						lapsa.slideContainer.classList.remove("theme-opacity-change");
					}, duration / 2);
				}
			}, 0);
			
			setTimeout(() =>
			{
				document.documentElement.classList.remove("theme-transition");
				lapsa.slideContainer.classList.remove("theme-transition");
				
				resolve();
			}, duration);
		});
	} as BuildFunction,
	
	
	
	5: function(slide, forward, duration = 300)
	{
		return new Promise((resolve, reject) =>
		{
			rootElement.style.setProperty("--theme-transition-time", `${duration}ms`);
			
			document.documentElement.classList.add("theme-transition");
			lapsa.slideContainer.classList.add("theme-transition");
			
			setTimeout(() =>
			{
				if (forward)
				{
					document.documentElement.classList.remove("dark-futuristic-theme-1");
					lapsa.slideContainer.classList.remove("dark-futuristic-theme-1");
					
					lapsa.slideContainer.classList.add("theme-opacity-change");
					
					setTimeout(() =>
					{
						lapsa.slideContainer.classList.remove("dark-futuristic-theme-2");
						lapsa.slideContainer.classList.remove("theme-opacity-change");
					}, duration / 2);
				}
				
				else
				{
					document.documentElement.classList.add("dark-futuristic-theme-1");
					lapsa.slideContainer.classList.add("dark-futuristic-theme-1");
					
					lapsa.slideContainer.classList.add("theme-opacity-change");
					
					setTimeout(() =>
					{
						lapsa.slideContainer.classList.add("dark-futuristic-theme-2");
						
						lapsa.slideContainer.classList.remove("theme-opacity-change");
					}, duration / 2);
				}
			}, 0);
			
			setTimeout(() =>
			{
				document.documentElement.classList.remove("theme-transition");
				lapsa.slideContainer.classList.remove("theme-transition");
				
				resolve();
			}, duration);
		});
	} as BuildFunction
};

const options =
{
	shelfIconPaths: "/icons/",
	
	builds:
	{
		"theme-demonstration": themeDemonstrationSlideBuilds
	}
};

const lapsa = new Lapsa(options);