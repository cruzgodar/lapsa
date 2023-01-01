!function()
{
	/*
	let lastTimestamp = -1;
	
	let totalTimeElapsed = 0;
	
	function updateMandelbrot(timestamp)
	{
		const timeElapsed = timestamp - lastTimestamp;
		
		lastTimestamp = timestamp;
		
		if (timeElapsed === 0)
		{
			return;
		}
		
		totalTimeElapsed += timeElapsed;
	}
	*/
	
	
	
	const options =
	{
		builds:
		{
			"theme-demonstration":
			{
				reset: (slide, forward, duration) =>
				{
					return new Promise((resolve, reject) =>
					{
						document.querySelector(":root").style.setProperty("--theme-transition-time", `${duration}ms`);
						
						document.documentElement.classList.add("theme-transition");
						lapsa.slideContainer.classList.add("theme-transition");
						
						setTimeout(() =>
						{
							document.documentElement.classList.remove("dark-industrial-theme");
							lapsa.slideContainer.classList.remove("dark-industrial-theme");
						}, 0);
						
						setTimeout(() =>
						{
							document.documentElement.classList.remove("theme-transition");
							lapsa.slideContainer.classList.remove("theme-transition");
							
							resolve();
						}, duration);
					});
				},
				
				
				
				2: (slide, forward, duration = 300) =>
				{
					return new Promise((resolve, reject) =>
					{
						document.querySelector(":root").style.setProperty("--theme-transition-time", `${duration}ms`);
						
						document.documentElement.classList.add("theme-transition");
						lapsa.slideContainer.classList.add("theme-transition");
						
						setTimeout(() =>
						{
							if (forward)
							{
								document.documentElement.classList.add("dark-industrial-theme-1");
								lapsa.slideContainer.classList.add("dark-industrial-theme-1");
								
								lapsa.slideContainer.classList.add("dark-industrial-theme-2");
								
								setTimeout(() =>
								{
									lapsa.slideContainer.classList.add("dark-industrial-theme-3");
									lapsa.slideContainer.classList.remove("dark-industrial-theme-2");
								}, duration / 2);
							}
							
							else
							{
								document.documentElement.classList.remove("dark-industrial-theme-1");
								lapsa.slideContainer.classList.remove("dark-industrial-theme-1");
								
								lapsa.slideContainer.classList.add("dark-industrial-theme-2");
								
								setTimeout(() =>
								{
									lapsa.slideContainer.classList.remove("dark-industrial-theme-3");
									lapsa.slideContainer.classList.remove("dark-industrial-theme-2");
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
				}
			}
		}
	};
	
    const lapsa = new Lapsa(options);
}()