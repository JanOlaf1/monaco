/**
 * Inline <head> script: marks <html data-learner="new|returning"> before the
 * first paint so the home page shows the right variant without a flash.
 * Must stay dependency-free and mirror `hasLearnerActivity` in summary.ts
 * (including `hasCompetencyChoices` in lib/learning/competency.ts).
 */
export const LEARNER_SCRIPT = `(function(){try{var read=function(key){return JSON.parse(localStorage.getItem("koodaamo:v1:"+key)||"null")};var p=read("progress");var g=read("gamification");var c=read("competency");var k=function(o){return o&&typeof o==="object"?Object.keys(o).length:0};var chose=false;if(c&&c.version===1){chose=c.onboarding==="completed"||c.onboarding==="skipped";var t=c.tracks&&typeof c.tracks==="object"?c.tracks:{};for(var id in t){var x=t[id];if(x&&(x.selfReportedLevel||x.placementResult||x.userOverride))chose=true;}}var r=(p&&(k(p.exercises)>0||p.lastVisited))||(g&&(k(g.awards)>0||g.preferredCourse))||chose;document.documentElement.setAttribute("data-learner",r?"returning":"new");}catch(e){}})();`;
