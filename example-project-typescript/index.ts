import { themeDemonstrationSlideBuilds } from "./builds/theme-demonstration.js";
import Lapsa, { LapsaOptions } from "/lapsa.js";


const options: LapsaOptions =
{
	shelfIconPaths: "/icons/",
	
	builds:
	{
		"theme-demonstration": themeDemonstrationSlideBuilds
	},
};

new Lapsa(options);