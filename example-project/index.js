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
						
						document.body.classList.add("theme-transition");
						lapsa.slideContainer.classList.add("theme-transition");
						
						document.body.classList.remove("dark-industrial-theme");
						lapsa.slideContainer.classList.remove("dark-industrial-theme");
						
						setTimeout(() =>
						{
							document.body.classList.remove("theme-transition");
							lapsa.slideContainer.classList.remove("theme-transition");
							
							resolve();
						}, duration);
					});
				},
				
				
				
				2: (slide, forward, duration = 500) =>
				{
					return new Promise((resolve, reject) =>
					{
						document.querySelector(":root").style.setProperty("--theme-transition-time", `${duration}ms`);
						
						document.body.classList.add("theme-transition");
						lapsa.slideContainer.classList.add("theme-transition");
						
						if (forward)
						{
							document.body.classList.add("dark-industrial-theme");
							lapsa.slideContainer.classList.add("dark-industrial-theme");
						}
						
						else
						{
							document.body.classList.remove("dark-industrial-theme");
							lapsa.slideContainer.classList.remove("dark-industrial-theme");
						}
						
						setTimeout(() =>
						{
							document.body.classList.remove("theme-transition");
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