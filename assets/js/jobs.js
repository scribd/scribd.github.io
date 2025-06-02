/*
 * This JavaScript file was hand-crafted by a developer who doesn't normally
 * write JavaScript and should not be considered indicative of how Scribd's
 * proper web engineers write JavaScript.
 *
 * With that disclaimer out of the way...
 *
 * This file handles the fetching of jobs from Lever^WAshby such that they can be
 * dynamically inserted into different parts of the tech blog
 */

/*
 * This API will return an list of departments which must then be filtered
 * through to find the .postings under each
 */
const API_URL = 'https://api.ashbyhq.com/posting-api/job-board/scribd?includeCompensation=true'


/*
 * Everybody loves globals, this will make sure we don't hit the API more than
 * we need to.
 */
window.jobsCache = {};
window.jobsFetched = false;


/**
 * Fetch the jobs from the Lever API and cache them into a page-wide global
 *
 * This will always return a Promise, even when the cache is hit
 */
function fetchJobs() {
  if (window.jobsFetched) {
    // Whoa there cowboy, only hit their API once per page
    return Promise.resolve(window.jobsCache);
  }

  return fetch(API_URL)
    .then(async (response) => {
      const board = await response.json();
      /*
       * Since this is the tech blog, we're only pulling a couple of
       * departments
       */
      board.jobs
        .filter(j => ['Engineering', 'Product, Design, & Analytics', 'Product'].includes(j.department))
        .filter(j => !j.title.toLowerCase().includes('marketing'))
        .forEach((job) => {
            const team = job.team;
            if (!window.jobsCache[team]) {
              window.jobsCache[team] = [];
            }
            window.jobsCache[team].push(job);
        });
      window.jobsFetched = true;
      return window.jobsCache;
    })
    .catch((err) => {
      console.error(`Failed to fetch the jobs from Lever, ruh roh  ${err}`);
    });
}


/**
 * Render the available jobs into the given element
 *
 * team is an optional parameter and will filter the results to just that team.
 * Send null to receive all engineering jobs
 *
 * Use the randomLimit parameter to receive a random slice of the jobs limited
 * to the number passed through
 */
function renderJobs(elem, team, randomLimit) {
  if (!elem) {
    console.error("Cannot renderJobs() to an empty element");
    return;
  }

  fetchJobs().then((jobs) => {
    let toRender = (team ? jobs[team] : Object.values(jobs).flat());

    /*
     * Sometimes we won't have any jobs for a team
     */
    if (!toRender) {
      return;
    }

    if (randomLimit) {
      shuffleArray(toRender);
      toRender = toRender.slice(0, randomLimit);
    }

    toRender.forEach((job) => {
      const li = document.createElement('li');
      li.className = 'card m-0 theme-midnight';
      li.innerHTML = `
      <div class="card__body">
          <h5 class="mt-0 mb-1 clamp-2">
              <a href="${job.jobUrl}" target="_blank" class="stretched-link link-text-color">${job.title}</a>
          </h5>
          <p class="m-0 fs-md monospace text-truncate">${job.location || ''}</p>
      </div>
`;
      elem.appendChild(li);
    });


  });
}


/*
 * Nice shuffle method courtesy of https://stackoverflow.com/a/12646864
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
