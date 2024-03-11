import { themeDemonstrationSlideBuilds } from "./builds/theme-demonstration.js";
import Lapsa from "/lapsa.js";


const options =
{
	shelfIconPaths: "/icons/",
	
	builds:
	{
		"theme-demonstration": themeDemonstrationSlideBuilds
	}
};

new Lapsa(options);