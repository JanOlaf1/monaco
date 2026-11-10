/**
 * Inline <head> script: marks <html data-learner="new|returning"> before the
 * first paint so the home page shows the right variant without a flash.
 * Must stay dependency-free and mirror `hasLearnerActivity` in summary.ts.
 */
export const LEARNER_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem("koodaamo:v1:progress")||"null");var g=JSON.parse(localStorage.getItem("koodaamo:v1:gamification")||"null");var k=function(o){return o&&typeof o==="object"?Object.keys(o).length:0};var r=(p&&(k(p.exercises)>0||p.lastVisited))||(g&&(k(g.awards)>0||g.preferredCourse));document.documentElement.setAttribute("data-learner",r?"returning":"new");}catch(e){}})();`;
