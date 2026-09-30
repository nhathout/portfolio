// Education + Experience: pixel-art layer over the timeline. Every stop gets a
// sprite waypoint on the rail, the spotlight reads like an RPG quest log, and a
// tiny pixel me walks down the rail as you scroll. Works on top of the markup
// and the edex logic in script.js + sections.js without replacing them.
(() => {
    const SPRITES = {
        cobot: [
            '................',
            '................',
            '......DDDDDDD...',
            '.....DsbDwwwLD..',
            '.....DbbDLLLLDD.',
            '....DwDDDDDDsbD.',
            '....DwLD....DbbD',
            '...DwLD......DD.',
            '...DwLD.....DLLD',
            '..DwLD......DGGD',
            '..DDsbD.....DkkD',
            '.DsbbbbD.....DD.',
            '.DbbbbbD........',
            'DLLLLLLLD.......',
            'DGGGGGGGD.......',
            'DDDDDDDDD.......'
        ],
        vision: [
            '................',
            '................',
            '..DDDDDDDDDDDD..',
            '.DGGGGGGGGGGGGD.',
            '.DGDDDGGGGDDDGD.',
            '.DDkcsDGGDkcsDD.',
            '.DDksbDGGDksbDD.',
            '.DGDDDGRGGDDDGD.',
            '.DGGGGGGGGGGGGD.',
            '..DDDDDDDDDDDD..',
            '.......DD.......',
            '.......DD.......',
            '......DLLD......',
            '....DDLLLLDD....',
            '...DGGGGGGGGD...',
            '...DDDDDDDDDD...'
        ],
        chip: [
            '................',
            '...y.y.y.y.y....',
            '..DDDDDDDDDDD...',
            '.yDqqqqqqqqqDy..',
            '..DqkkkkkkkqD...',
            '.yDqkDDDDDkqDy..',
            '..DqkDcccDkqD...',
            '.yDqkDcwcDkqDy..',
            '..DqkDcccDkqD...',
            '.yDqkDDDDDkqDy..',
            '..DqkkkkkkkqD...',
            '.yDqqqqqqqgqDy..',
            '..DDDDDDDDDDD...',
            '...y.y.y.y.y....',
            '................',
            '................'
        ],
        gear: [
            '....D...DDD.....',
            '...DLD.DLLLD....',
            '..DLLLDLLLD.DD..',
            '..DLLLLLLLLDGGD.',
            '.D.DLLLLLLLGGGGD',
            'DLDLLLGGGGGGGGD.',
            'DLLLLGRRRRGGGD..',
            'DLLLLGRRRRGGGGD.',
            '.DLLLGRRRRGGGGGD',
            '..DLLGRRRRGGGGGD',
            '.DLLLGGGGGGGGDGD',
            'DLLLGGGGGGGGD.D.',
            '.DLGDGGGGGGGGD..',
            '..DD.DGGGDGGGD..',
            '....DGGGD.DGD...',
            '.....DDD...D....'
        ],
        mortarboard: [
            '................',
            '................',
            '.......DD.......',
            '.....DDkkDD.....',
            '...DDkkkkkkDD...',
            '.DDkkkkkkkkkkDD.',
            'DkkkkkkkykkkkkkD',
            '.DDkkkkkkyykkDD.',
            '...DDkkkkkkyDD..',
            '....DDDkkDDDyD..',
            '....DrrrrrrDyD..',
            '....DrrrrrrDyyD.',
            '....DrrrrrrD.D..',
            '....DDrrrrDD....',
            '......DDDD......',
            '................'
        ],
        diploma: [
            '................',
            '................',
            '................',
            '..DDDDDDDDDDDD..',
            '.DhwwwwwwwwwwhD.',
            'DhDwwwwwwwwwwDhD',
            'DhDwLLLLLLLLwDhD',
            'DhDwwwwwwwwwwDhD',
            'DhDwLLLLLRRwwDhD',
            'DhDwwwwwwRyRwDhD',
            'DhDwLLLLwRRwwDhD',
            '.DhwwwwwwRwRwhD.',
            '..DDDDDDDRDRDD..',
            '.........R.R....',
            '................',
            '................'
        ],
        chalkboard: [
            '................',
            '.MMMMMMMMMMMMMM.',
            '.MmmmmmmmmmmmmM.',
            '.MmqqqqqqqqqqmM.',
            '.MmqwwqqqwqqqmM.',
            '.MmqqqwqwqwqqmM.',
            '.MmqqwqqqqqwqmM.',
            '.MmqwwwqqwwwqmM.',
            '.MmqqqqqqqqqqmM.',
            '.MmmmmmmmmmmmmM.',
            '.MMMMMwwMyMMMMM.',
            '..MM........MM..',
            '..MM........MM..',
            '.MM..........MM.',
            '.M............M.',
            '................'
        ],
        megaphone: [
            '................',
            '..........DD....',
            '........DDsD..y.',
            '......DDssbD...y',
            '....DDsssbbD.y..',
            '.DDDDssssbbD..y.',
            '.DwwDssssbbD.y.y',
            '.DwwDssssbbD..y.',
            '.DDDDssssbbD.y..',
            '....DDsssbbD...y',
            '...DDDDDssbD..y.',
            '...DGGD.DDsD....',
            '...DGGD...DD....',
            '...DGGD.........',
            '....DD..........',
            '................'
        ],
        bag: [
            '................',
            '.....DDDDDD.....',
            '....DD....DD....',
            '....D......D....',
            '..DDDDDDDDDDDD..',
            '..DyyyyyyyyyyD..',
            '..DyyRRyyRRyyD..',
            '..DyRRRRRRRRyD..',
            '..DyRRRRRRwRyD..',
            '..DyRRRRRRRRyD..',
            '..DyyRRRRRRyyD..',
            '..DyyyRRRRyyyD..',
            '..DyyyyRRyyyyD..',
            '..DzzzzzzzzzzD..',
            '..DDDDDDDDDDDD..',
            '................'
        ],
        school: [
            '.......DRR......',
            '.......DRRR.....',
            '.......D........',
            '......DDD.......',
            '.....DpppD......',
            '....DpppppD.....',
            '...DpppypppD....',
            '..DDDDDDDDDDD...',
            '..DhhhhhhhhhD...',
            '..DhcchhhcchD...',
            '..DhcchhhcchD...',
            '..DhhhhhhhhhD...',
            '..DhhhDDDhhhD...',
            '..DhhhDMDhhhD...',
            '.DDDDDDDDDDDDD..',
            '................'
        ],
        check: [
            '..........',
            '........DD',
            '.......DgD',
            '......DgD.',
            '.DD..DgD..',
            'DgDDDgD...',
            '.DggggD...',
            '..DggD....',
            '...DD.....',
            '..........'
        ],
        bang: [
            '...DDDD...',
            '...DyyD...',
            '...DyyD...',
            '...DyyD...',
            '...DyyD...',
            '...DyyD...',
            '...DDDD...',
            '...DDDD...',
            '...DyyD...',
            '...DDDD...'
        ],
        star: [
            '....DD....',
            '....Dy....',
            '...DyyD...',
            'DDDDyyDDDD',
            'DyyyyyyyyD',
            '.DyyyyyyD.',
            '..DyyyyD..',
            '..DyDDyD..',
            '.DyD..DyD.',
            '.DD....DD.'
        ],
        pin: [
            '...DDDD...',
            '..DRRRRD..',
            '.DRRRRRRD.',
            '.DRRwwRRD.',
            '.DRRwwRRD.',
            '.DRRRRRRD.',
            '..DRRRRD..',
            '...DRRD...',
            '....DD....',
            '..........'
        ],
        case: [
            '..........',
            '...DDDD...',
            '...D..D...',
            'DDDDDDDDDD',
            'DmmmmmmmmD',
            'DmmmyymmmD',
            'DMMMyyMMMD',
            'DmmmmmmmmD',
            'DmmmmmmmmD',
            'DDDDDDDDDD'
        ],
        cap: [
            '..........',
            '....DD....',
            '..DDkkDD..',
            'DDkkkkkkDD',
            '.DDkkkkyD.',
            '..DkkkkDy.',
            '..DrrrrDy.',
            '..DrrrrD..',
            '...DDDD...',
            '..........'
        ],
        walk_0: [
            '...kkkkkk...',
            '..kkMkkkMkk.',
            '.kkkkkkkkkkk',
            '.kMkkkkkMkkk',
            '.kkzzzzzzkk.',
            '..kzzzzzzk..',
            '..kkkkkkkk..',
            '..kwkkkwkk..',
            '..zzzzozzz..',
            '..zkkkkkkz..',
            '...kkkkkk...',
            '..DDDwwDDD..',
            '.zDDDwwDDDz.',
            '...DDwwDD...',
            '...nnnnnn...',
            '...nn..nn...',
            '...kk..kk...'
        ],
        walk_1: [
            '...kkkkkk...',
            '..kkMkkkMkk.',
            '.kkkkkkkkkkk',
            '.kMkkkkkMkkk',
            '.kkzzzzzzkk.',
            '..kzzzzzzk..',
            '..kkkkkkkk..',
            '..kwkkkwkk..',
            '..zzzzozzz..',
            '..zkkkkkkz..',
            '...kkkkkk...',
            '..DDDwwDDD..',
            '.zDDDwwDDD..',
            '...DDwwDDDz.',
            '...nnnnnn...',
            '...nn..nn...',
            '...kk...kk..'
        ],
        walk_2: [
            '...kkkkkk...',
            '..kkMkkkMkk.',
            '.kkkkkkkkkkk',
            '.kMkkkkkMkkk',
            '.kkzzzzzzkk.',
            '..kzzzzzzk..',
            '..kkkkkkkk..',
            '..kwkkkwkk..',
            '..zzzzozzz..',
            '..zkkkkkkz..',
            '...kkkkkk...',
            '..DDDwwDDD..',
            '..DDDwwDDDz.',
            '.zDDDwwDD...',
            '...nnnnnn...',
            '...nn..nn...',
            '..kk...kk...'
        ]
    };

    const kit = window.PixelKit;
    const reducedMotion = kit?.reducedMotion ?? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    // Each timeline card, keyed by `data-title|data-org`: its pixel sprite and quest state.
    const QUESTS = {
        'AI Engineer Intern|Universal Robots': { sprite: 'cobot', kind: 'main', done: false },
        'Lead Software Engineer|UMG Technologies, Inc.': { sprite: 'gear', kind: 'side', done: false },
        'M.S. in R&AS|Boston University': { sprite: 'mortarboard', kind: 'main', done: false },
        'B.S. in CE|Boston University': { sprite: 'diploma', done: true },
        'Research & Development Intern|Universal Robots': { sprite: 'vision', done: true },
        'Apprentice|Universal Robots': { sprite: 'chip', done: true },
        'Teaching Assistant|Boston University, College of Engineering': { sprite: 'chalkboard', done: true },
        'Campus Representative|Course Hero': { sprite: 'megaphone', done: true },
        'Founder & Designer|GriplS': { sprite: 'bag', done: true },
        'High School Diploma|Ardrey Kell High School': { sprite: 'school', done: true }
    };

    function questFor(card) {
        return QUESTS[`${card.dataset.title}|${card.dataset.org}`] || { sprite: card.dataset.category === 'education' ? 'mortarboard' : 'case', done: !/present/i.test(card.dataset.period || '') };
    }

    function statusText(quest) {
        if (quest.done) return 'Quest complete';
        return quest.kind === 'side' ? 'Side quest · in progress' : 'Main quest · in progress';
    }

    function scaledCanvas(name, className) {
        const canvas = kit.canvasFor(SPRITES[name], className);
        return canvas;
    }

    const shell = document.querySelector('#education-experience .edex-shell');
    const rail = document.getElementById('edexRail');
    const cards = Array.from(document.querySelectorAll('#education-experience .edex-card'));
    if (!kit || !shell || !rail || !cards.length) return;

    // ---------------------------------------------------------------------
    //  Rail nodes: every stop on the timeline becomes a pixel waypoint
    // ---------------------------------------------------------------------
    cards.forEach(card => {
        const quest = questFor(card);
        card.dataset.quest = quest.done ? 'done' : quest.kind || 'main';
        const node = document.createElement('span');
        node.className = 'edex-node';
        node.setAttribute('aria-hidden', 'true');
        node.appendChild(scaledCanvas(quest.sprite, 'edex-node__sprite'));
        const mark = scaledCanvas(quest.done ? 'check' : 'bang', `edex-node__mark edex-node__mark--${quest.done ? 'done' : 'active'}`);
        node.appendChild(mark);
        card.appendChild(node);

        // screen readers get the quest state as text
        const sr = document.createElement('span');
        sr.className = 'sr-only';
        sr.textContent = ` (${statusText(quest)})`;
        card.querySelector('.edex-card__title')?.appendChild(sr);
    });
    rail.classList.add('has-pixel-nodes');

    // ---------------------------------------------------------------------
    //  Header: stat + filter icons, quest-log kicker
    // ---------------------------------------------------------------------
    const statIcons = ['star', 'cap', 'case', 'pin'];
    shell.querySelectorAll('.edex-stat').forEach((stat, index) => {
        if (!statIcons[index]) return;
        stat.appendChild(scaledCanvas(statIcons[index], 'edex-stat__icon'));
    });
    const filterIcons = { all: 'star', experience: 'case', education: 'cap' };
    shell.querySelectorAll('.edex-filter').forEach(button => {
        const icon = filterIcons[button.dataset.filter];
        if (icon) button.prepend(scaledCanvas(icon, 'edex-filter__icon'));
    });

    // ---------------------------------------------------------------------
    //  Spotlight: quest banner, synced to the active card
    // ---------------------------------------------------------------------
    const spotlight = document.getElementById('edexSpotlight');
    let banner = null;
    let bannerSprite = null;
    let bannerKind = null;
    let bannerStatus = null;
    let shownKey = null;

    function buildSpotlight() {
        if (!spotlight) return;
        banner = document.createElement('div');
        banner.className = 'edex-quest';
        const tile = document.createElement('span');
        tile.className = 'edex-quest__tile';
        bannerSprite = document.createElement('canvas');
        bannerSprite.className = 'edex-quest__sprite';
        bannerSprite.width = 16;
        bannerSprite.height = 16;
        bannerSprite.setAttribute('aria-hidden', 'true');
        tile.appendChild(bannerSprite);
        const text = document.createElement('div');
        text.className = 'edex-quest__text';
        bannerKind = document.createElement('p');
        bannerKind.className = 'edex-quest__kind';
        bannerStatus = document.createElement('p');
        bannerStatus.className = 'edex-quest__status';
        text.append(bannerKind, bannerStatus);
        banner.append(tile, text);

        const top = spotlight.querySelector('.edex-spotlight__top');
        spotlight.insertBefore(banner, top);
    }

    function syncSpotlight() {
        const active = cards.find(card => card.classList.contains('is-active'));
        if (!active || !banner) return;
        const key = `${active.dataset.title}|${active.dataset.org}`;
        if (key === shownKey) return;
        shownKey = key;
        const quest = questFor(active);
        kit.redraw(bannerSprite, ctx => kit.paint(ctx, SPRITES[quest.sprite]));
        bannerKind.textContent = quest.done ? `${active.dataset.categoryLabel || 'Quest'} · cleared` : (quest.kind === 'side' ? 'Side quest' : 'Main quest');
        bannerStatus.textContent = '';
        const statusIcon = scaledCanvas(quest.done ? 'check' : 'bang', 'edex-quest__status-icon');
        bannerStatus.append(statusIcon, document.createTextNode(quest.done ? 'Complete' : 'In progress'));
        banner.dataset.state = quest.done ? 'done' : 'active';
        if (!reducedMotion) {
            banner.classList.remove('is-swapping');
            void banner.offsetWidth;
            banner.classList.add('is-swapping');
        }
    }

    buildSpotlight();
    const meta = document.getElementById('edexSpotlightMeta');
    const titleEl = document.getElementById('edexSpotlightTitle');
    if ('MutationObserver' in window) {
        const observer = new MutationObserver(syncSpotlight);
        if (meta) observer.observe(meta, { childList: true });
        if (titleEl) observer.observe(titleEl, { childList: true, characterData: true, subtree: true });
    }
    syncSpotlight();

    // ---------------------------------------------------------------------
    //  Walker: a pixel me that walks down the rail as you scroll
    // ---------------------------------------------------------------------
    function initWalker() {
        const walker = document.createElement('canvas');
        walker.className = 'edex-walker';
        walker.width = 12;
        walker.height = 16;
        walker.setAttribute('aria-hidden', 'true');
        rail.appendChild(walker);
        kit.redraw(walker, ctx => kit.paint(ctx, SPRITES.walk_0));

        let lastY = null;
        let distance = 0;
        let frame = 0;
        let idleTimer = null;
        let queued = false;
        let listening = false;

        const place = () => {
            queued = false;
            // same anchor sections.js uses for the progress fill, so the walker rides its tip
            const anchor = window.innerHeight * 0.55;
            const rect = rail.getBoundingClientRect();
            const ratio = Math.min(1, Math.max(0, (anchor - rect.top) / Math.max(1, rect.height)));
            const y = Math.round(ratio * rail.clientHeight);
            walker.style.transform = `translate3d(0, ${y}px, 0)`;
            walker.classList.toggle('is-home', ratio <= 0 || ratio >= 1);
            if (lastY !== null && y !== lastY && !reducedMotion && ratio > 0 && ratio < 1) {
                distance += Math.abs(y - lastY);
                if (distance > 14) {
                    distance = 0;
                    frame = frame === 1 ? 2 : 1;
                    kit.redraw(walker, ctx => kit.paint(ctx, SPRITES[`walk_${frame}`]));
                }
                clearTimeout(idleTimer);
                idleTimer = setTimeout(() => kit.redraw(walker, ctx => kit.paint(ctx, SPRITES.walk_0)), 160);
            }
            lastY = y;
        };
        const schedule = () => {
            if (queued) return;
            queued = true;
            requestAnimationFrame(place);
        };
        const listen = on => {
            if (on === listening) return;
            listening = on;
            if (on) {
                window.addEventListener('scroll', schedule, { passive: true });
                window.addEventListener('resize', schedule);
                schedule();
            } else {
                window.removeEventListener('scroll', schedule);
                window.removeEventListener('resize', schedule);
            }
        };
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(entries => listen(entries[0].isIntersecting), { rootMargin: '200px 0px' }).observe(rail);
        } else {
            listen(true);
        }
        // filters change the rail's height
        shell.querySelectorAll('.edex-filter').forEach(button => button.addEventListener('click', () => requestAnimationFrame(schedule)));
        place();
    }

    initWalker();
})();
