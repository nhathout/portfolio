// About section: polaroid photo deck, a scroll-driven world tour, and animated
// side-quest cards. Content lives in the three arrays right below. The pixel art
// is hand-drawn in SPRITES (one character per pixel, colors from PIXEL_PALETTE,
// "." = transparent) and painted onto tiny canvases scaled up with CSS.
(() => {
    const section = document.getElementById('about');
    if (!section) return;

    // -----------------------------------------------------------------
    //  Content: edit these arrays to add photos, stops, or side quests
    // -----------------------------------------------------------------

    // Polaroid deck, top card first. Add more with { src, alt, caption }.
    const aboutPhotos = [
        { src: 'assets/opt/aboutME2.webp', alt: 'Headshot of Noah in a navy suit', caption: 'Headshot mode' },
        { src: 'assets/opt/aboutME.webp', alt: 'Noah in front of a sea turtle mural', caption: 'Sea-turtle mural' },
        { src: 'assets/opt/aboutME3.webp', alt: 'Noah and a friend striking a playful pose in front of the MIT dome', caption: 'Striking a pose at MIT' }
    ];

    // World tour stops, in order. Optional fields:
    //   photo: 'assets/opt/....webp'  shows a real picture instead of the pixel scene
    //   note:  extra line under the title
    //   stamp: ['line', 'line', ...]  a passport stamp on the card
    const aboutStops = [
        { flag: '🇺🇸', country: 'United States', region: 'North America', title: 'Where it all started', sprite: 'liberty', sky: ['#a9dcff', '#f4f9ff'], ground: '#5fae93' },
        { flag: '🇩🇪', country: 'Germany', region: 'Europe', title: 'First move abroad', sprite: 'brandenburg', sky: ['#bcc8ff', '#eef1ff'], ground: '#94b0c2' },
        { flag: '🇹🇷', country: 'Türkiye', region: 'Europe · Asia', title: 'Where East meets West', sprite: 'mosque', sky: ['#ffc38f', '#ffefdc'], ground: '#c98a4b' },
        { flag: '🇳🇱', country: 'Netherlands', region: 'Europe', title: 'Windmills, canals & bikes', sprite: 'windmill', sky: ['#9fdcff', '#e9fbff'], ground: '#38b764' },
        { flag: '🇹🇷', country: 'Türkiye', region: 'Europe · Asia', title: 'Back for round two', sprite: 'tea', sky: ['#ffb99c', '#fff0e6'], ground: '#b13e53' },
        { flag: '🇨🇳', country: 'China', region: 'Asia', title: 'Three continents, unlocked', sprite: 'pagoda', sky: ['#ffcfc2', '#fff4ee'], ground: '#566c86' },
        { flag: '🇩🇪', country: 'Germany', region: 'Europe', title: 'Another chapter in Germany', sprite: 'pretzel', sky: ['#cdd3ff', '#f6f3ff'], ground: '#94b0c2' },
        {
            flag: '🇺🇸',
            country: 'United States',
            region: 'North America',
            title: 'Home base 📍',
            sprite: 'citgo',
            night: true,
            sky: ['#1f2a55', '#5a4b99'],
            ground: '#333c57',
            note: 'High school at Ardrey Kell in Charlotte, NC (2017–2021), then Boston University: B.S. CE ’25, M.S. R&AS in progress.',
            stamp: ['Odense · DK', 'Summer ’24', 'UR R&D intern']
        }
    ];

    // Side quests. `link` opens a URL; `project` opens that project's detail dialog.
    const aboutQuests = [
        { sprite: 'climb', title: 'Climbing', text: 'You’ll find me at the nearest climbing gym.', tint: ['#ffe3c9', '#ffc99f'] },
        { sprite: 'tennis', title: 'Tennis', text: 'Four years on varsity in high school, two as captain.', tint: ['#e8f8cf', '#c9eca0'] },
        { sprite: 'gamepad', title: 'Gaming & streaming', text: 'Leveling up in the latest games, sometimes live on Twitch.', tint: ['#e8e0ff', '#cbbcff'], link: { label: 'twitch.tv/sernawa', href: 'https://www.twitch.tv/sernawa' } },
        { sprite: 'robot', title: 'Teaching agents', text: 'Teaching an agent to do better than me at the video game.', tint: ['#d8f5ff', '#aee4f8'], project: { label: 'See SuperTuxSmart', id: 'supertuxsmart' } },
        { sprite: 'printer', title: '3D printing & CAD', text: 'Designing parts in Onshape and printing them on a Bambu Lab.', tint: ['#ffe4ec', '#ffc2d4'] },
        { sprite: 'soccer', title: 'Soccer', text: 'Indoor and outdoor intramurals at BU.', tint: ['#dcf5e5', '#b5e6c6'] }
    ];

    // -----------------------------------------------------------------
    //  Pixel art
    // -----------------------------------------------------------------
    const PIXEL_PALETTE = {
        k: '#1a1c2c', D: '#333c57', G: '#566c86', L: '#94b0c2', w: '#f4f4f4',
        r: '#b13e53', o: '#ef7d57', y: '#ffcd75', l: '#a7f070', g: '#38b764',
        t: '#257179', n: '#29366f', b: '#3b5dc9', s: '#41a6f6', c: '#73eff7',
        p: '#5d275d', P: '#9ad9bd', Q: '#5fae93', q: '#2f6f5e', m: '#b86f3c',
        M: '#6e3b1f', e: '#e9b27a', R: '#e0433f', z: '#c98a4b', h: '#f2c9a0'
    };
    const SPRITES = {
        liberty: [
            '....y...............',
            '...yoy..............',
            '...oyo..............',
            '...kzk..............',
            '....Q....P.P.P......',
            '....Qq..PPPPPPP.....',
            '.....Qq..PPPPQ......',
            '.....Qq..PPPPQ......',
            '......QqqQPPQ.......',
            '.......QQQQQQQ......',
            '.......QPPPQQQQ.....',
            '.......QPPQQQPPPq...',
            '.......QPPQQQPPPq...',
            '.......QPQQQQPPPq...',
            '......QPPQQQQqqqq...',
            '......QPPQQQQQq.....',
            '......QPQQQQQQq.....',
            '.....QPPQQQQQQQq....',
            '...LLLLLLLLLLLLLLL..',
            '....GGGGGGGGGGGGG...',
            '....GLGGDGGGDGGLG...',
            '....GLGGDGGGDGGLG...',
            '....GGGGGGGGGGGGG...',
            '...DDDDDDDDDDDDDDD..'
        ],
        brandenburg: [
            '....................',
            '....................',
            '.........kk.........',
            '........kGGk........',
            '......k.kGGk.k......',
            '.....kGkGGGGkGk.....',
            '....kkkkkkkkkkkk....',
            '..mmmmmmmmmmmmmmmm..',
            '..meeeeeeeeeeeeeem..',
            '..mzzzzzzzzzzzzzzm..',
            '.yyyyyyyyyyyyyyyyyy.',
            '.eeeeeeeeeeeeeeeeee.',
            '.ye.ye.ye..ye.ye.ye.',
            '.ye.ye.ye..ye.ye.ye.',
            '.ye.ye.ye..ye.ye.ye.',
            '.ye.ye.ye..ye.ye.ye.',
            '.ye.ye.ye..ye.ye.ye.',
            '.ye.ye.ye..ye.ye.ye.',
            '.ye.ye.ye..ye.ye.ye.',
            '.ye.ye.ye..ye.ye.ye.',
            '.ye.ye.ye..ye.ye.ye.',
            'yyyyyyyyyyyyyyyyyyyy',
            'eeeeeeeeeeeeeeeeeeee',
            'mmmmmmmmmmmmmmmmmmmm'
        ],
        mosque: [
            '.y................y.',
            '.D................D.',
            'DDD..............DDD',
            'LLL......yy......LLL',
            'LwL......GG......LwL',
            'LLL.....DGGD.....LLL',
            'LLL....DLGGGD....LLL',
            'GGG...DLLGGGGD...GGG',
            'LwL..DLLGGGGGGD..LwL',
            'LLL..DLGGGGGGGD..LLL',
            'LLL.DDDDDDDDDDDD.LLL',
            'LLL.LnLLnLLnLLnL.LLL',
            'LLL.DDDDDDDDDDDD.LLL',
            'LLL.DGGD....DGGD.LLL',
            'LLLDLGGGDLLDLGGGDLLL',
            'LLLLLLLLLLLLLLLLLLLL',
            'LLLLnLLnLLLLnLLnLLLL',
            'LLLLnLLnLLLLnLLnLLLL',
            'LLLLLLLLLnnLLLLLLLLL',
            'LLLLLLLLnnnnLLLLLLLL',
            'LLLLLLLLnnnnLLLLLLLL',
            'GGGGGGGGGGGGGGGGGGGG',
            'DDDDDDDDDDDDDDDDDDDD',
            '....................'
        ],
        windmill: [
            '.ww..............ww.',
            '.wLw............wLw.',
            '..wLw..........wLw..',
            '...wLw........wLw...',
            '....wLw......wLw....',
            '.....wLw....wLw.....',
            '......wLw..wLw......',
            '.......wLkkLw.......',
            '........kyyk........',
            '.......wMkkMw.......',
            '......wLMmmMLw......',
            '.....wLwMmmMwLw.....',
            '....wLw.MmmmMwLw....',
            '...wLw.MmmmmmMwLw...',
            '..wLw..MmmwmmM.wLw..',
            '.ww....MmmwmmM..ww..',
            '.......MmmmmmM......',
            '......MmmmmmmmM.....',
            '......MmmyymmmM.....',
            '......MmmyymmmM.....',
            '.....MmmmyymmmmM....',
            '.....MmmmyymmmmM....',
            '....gggggggggggggg..',
            '...gggggggggggggggg.'
        ],
        windmill_b: [
            '.........ww.........',
            '.........wL.........',
            '.........wL.........',
            '.........wL.........',
            '.........wL.........',
            '.........wL.........',
            '.........wL.........',
            '.........kk.........',
            'wwwwwwwwkyykwwwwwwww',
            'LLLLLLLMkkkkMLLLLLLL',
            '........MmmM........',
            '........MmmM........',
            '........wLmmM.......',
            '.......MwLmmmM......',
            '.......MwLwmmM......',
            '.......MwLwmmM......',
            '.......MmwwmmM......',
            '......MmmmmmmmM.....',
            '......MmmyymmmM.....',
            '......MmmyymmmM.....',
            '.....MmmmyymmmmM....',
            '.....MmmmyymmmmM....',
            '....gggggggggggggg..',
            '...gggggggggggggggg.'
        ],
        tea: [
            '....................',
            '........w...w.......',
            '.......w...w........',
            '........w...w.......',
            '.......w...w........',
            '....................',
            '.....LLLLLLLLLL.....',
            '.....LwrrrrrrrL.....',
            '.....LworrrrrrL.....',
            '......LworrrrL......',
            '......LworrrrL......',
            '.......LorrrL.......',
            '........LrrL........',
            '.......LworrL.......',
            '......LworrrrL......',
            '......LworrrrL......',
            '......LworrrrL......',
            '......LLLLLLLL......',
            '....RRRRRRRRRRRR....',
            '...RwwwwwwwwwwwwR...',
            '....RRRRRRRRRRRR....',
            '......RRRRRRRR......',
            '....................',
            '....................'
        ],
        pagoda: [
            '.........yy.........',
            '.........yy.........',
            '........kyyk........',
            '..t....tttttt....t..',
            '...tttttttttttttt...',
            '......rrrrrrrr......',
            '......ryrrrryr......',
            '......rrrrrrrr......',
            '.t...tttttttttt...t.',
            '..tttttttttttttttt..',
            '.....rrrrrrrrrr.....',
            '.....ryrrrrrryr.....',
            '.....rrrrrrrrrr.....',
            't..tttttttttttttt..t',
            '.tttttttttttttttttt.',
            '....rrrrrrrrrrrr....',
            '....ryrrryyrrryr....',
            '....rrrrryyrrrrr....',
            '....rrrrryyrrrrr....',
            '....rrrrryyrrrrr....',
            '..LLLLLLLLLLLLLLLL..',
            '.GGGGGGGGGGGGGGGGGG.',
            '....................',
            '....................'
        ],
        pretzel: [
            '....................',
            '....................',
            '....................',
            '....MMMM....MMMM....',
            '...MmmemM..MmemmM...',
            '..MmeMMmmMMmmMMemM..',
            '.MmeM..MmmmmM..MemM.',
            '.MmM....MmmM....MmM.',
            '.MmM...MmMMmM...MmM.',
            '.MmM..MmM..MmM..MmM.',
            '.MmmMMmM....MmMMmmM.',
            '..MmmmM......MmmmM..',
            '..MmmmmM....MmmmmM..',
            '.MmMMMmmM..MmmMMMmM.',
            '.MmM..MmmMMmmM..MmM.',
            '.MmwM..MmmmmM..MwmM.',
            '..MmmM..MmmM..MmmM..',
            '...MmmMMmwmmMMmmM...',
            '....MMmmmmmmmmMM....',
            '......MMMMMMMM......',
            '....................',
            '....................',
            '....................',
            '....................'
        ],
        citgo: [
            '....................',
            '..DDDDDDDDDDDDDDDD..',
            '..DwwwwwwwwwwwwwwD..',
            '..DwwwwwwRRwwwwwwD..',
            '..DwwwwwRRRRwwwwwD..',
            '..DwwwwRRRRRRwwwwD..',
            '..DwwwRRwwwwRRwwwD..',
            '..DwwRRRRwwRRRRwwD..',
            '..DwRRRRRRRRRRRRwD..',
            '..DwwwwwwwwwwwwwwD..',
            '..DbbbbbbbbbbbbbbD..',
            '..DbwwbwwbwwbwwbbD..',
            '..DbwwbwwbwwbwwbbD..',
            '..DbbbbbbbbbbbbbbD..',
            '..DDDDDDDDDDDDDDDD..',
            '....G..G....G..G....',
            '....GG.G....G.GG....',
            '....G.GG....GG.G....',
            '....GG.G....G.GG....',
            '....G.GG....GG.G....',
            '..mmmmmmmmmmmmmmmm..',
            '..meMeMeMeMeMeMeMm..',
            '..mmmmmmmmmmmmmmmm..',
            '..meMeMeMeMeMeMeMm..'
        ],
        climb: [
            'GGGGGGGGGGGGGGGG',
            'GLGGGGGGGGGGGGLG',
            'GGGGGGrrGGGGGGGG',
            'GGyyGGrGGGGGGGGG',
            'GGyGGGGGGGgGGGGG',
            'GGGGGGGGGGggGGGG',
            'GGGGGssGGGGGGGGG',
            'GGGGGsGGGGGGGGGG',
            'GGGGGGGGGGGGooGG',
            'GGGgGGGGGGGGoGGG',
            'GGggGGGGGGGGGGGG',
            'GGGGGGGGyyGGGGGG',
            'GGGGGGGGyGGGGGGG',
            'GLGGrrGGGGGGGGLG',
            'GGGGrGGGGGGGGGGG',
            'DDDDDDDDDDDDDDDD'
        ],
        climber: [
            '.hh..',
            '.hh..',
            'rrrr.',
            'hrr.h',
            '.nn..',
            '.n.n.',
            'n...n'
        ],
        tennis: [
            '....DDDDD.......',
            '...DwLwLwD......',
            '..DLwLwLwLD.....',
            '..DwLwLwLwD.....',
            '..DLwLwLwLD.....',
            '..DwLwLwLwD.....',
            '...DLwLwLD......',
            '....DDDDD.......',
            '......Dr........',
            '.......Dr.......',
            '........Dr......',
            '.........Dr.....',
            '..........rr....',
            '...........rr...',
            '............r...',
            '................'
        ],
        ball: [
            '.ll.',
            'lwll',
            'llwl',
            '.ll.'
        ],
        gamepad: [
            '................',
            '................',
            '................',
            '...DDDDDDDDDD...',
            '..DGGGGGGGGGGD..',
            '.DGGkGGGGGGyGGD.',
            '.DGkkkGGGGrGsGD.',
            '.DGGkGGDDGGgGGD.',
            '.DGGGGGGGGGGGGD.',
            '.DGGGDDDDDDGGGD.',
            '.DGGD......DGGD.',
            '..DD........DD..',
            '................',
            '................',
            '................',
            '................'
        ],
        robot: [
            '.......R........',
            '.......D........',
            '...DDDDDDDDDD...',
            '..DLLLLLLLLLLD..',
            '..DLkkkkkkkkLD..',
            '.GDLkcckkcckLDG.',
            '.GDLkcckkcckLDG.',
            '..DLkkkkkkkkLD..',
            '..DLLLkyykLLLD..',
            '..DLLLLLLLLLLD..',
            '...DDDDDDDDDD...',
            '.....DLLLLD.....',
            '...DDDDDDDDDD...',
            '..DGGGGsGGGGGD..',
            '..DGGGGGGGGGGD..',
            '..DDDDDDDDDDDD..'
        ],
        printer: [
            'DDDDDDDDDDDDDDDD',
            'DGGGGGGGGGGGGGGD',
            'DG............GD',
            'DG.....oo.....GD',
            'DGLLLLLooLLLLLGD',
            'DG.....DD.....GD',
            'DG......r.....GD',
            'DG............GD',
            'DG............GD',
            'DG....ssss....GD',
            'DG...ssssss...GD',
            'DG...ssssss...GD',
            'DGDDDDDDDDDDDDGD',
            'DGGGGGGGGGGGGGGD',
            'DDDDDDDDDDDDDDDD',
            '.D............D.'
        ],
        soccer: [
            '................',
            '................',
            '.....kkkkkk.....',
            '...kkwwkkwwkk...',
            '..kwwwkkkkwwwk..',
            '..kwwwwkkwwwwk..',
            '.kkwwwwwwwwwwkk.',
            '.kkkwwwkkwwwkkk.',
            '.kkwwwkkkkwwwkk.',
            '.kwwwwwkkwwwwwk.',
            '..kwwwwwwwwwwk..',
            '..kkwwkkkkwwkk..',
            '...kkwkkkkwkk...',
            '.....kkkkkk.....',
            '................',
            '................'
        ],
        plane: [
            '...........DD...',
            '..........DsD...',
            'DD.......DssD...',
            'DsD.....DssD....',
            'DwwwwwwwwwwwwwD.',
            'DwsDsDsDsDsDwwwD',
            '.DwwwwwwwwwwwwD.',
            '......DssD......',
            '.....DssD.......',
            '.....DD.........'
        ]
    };

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    // Paint a sprite at (dx, dy). `swap` maps palette keys to other keys or raw colors.
    function paint(ctx, rows, dx = 0, dy = 0, swap = null) {
        for (let y = 0; y < rows.length; y++) {
            const row = rows[y];
            for (let x = 0; x < row.length; x++) {
                let key = row[x];
                if (key === '.') continue;
                if (swap && swap[key]) key = swap[key];
                if (key === '.') continue;
                ctx.fillStyle = PIXEL_PALETTE[key] || key;
                ctx.fillRect(dx + x, dy + y, 1, 1);
            }
        }
    }

    function createSpriteCanvas(name, className) {
        const rows = SPRITES[name];
        const canvas = document.createElement('canvas');
        canvas.width = rows[0].length;
        canvas.height = rows.length;
        canvas.className = className;
        canvas.setAttribute('aria-hidden', 'true');
        paint(canvas.getContext('2d'), rows);
        return canvas;
    }

    function repaint(canvas, draw) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        draw(ctx);
    }

    // One slow shared ticker drives every pixel animation; it idles when nothing is active.
    const animators = new Set();
    let tickTimer = null;
    let tickFrame = 0;

    function tick() {
        tickFrame += 1;
        let busy = false;
        animators.forEach(animator => {
            if (!animator.active) return;
            busy = true;
            animator.step(tickFrame);
        });
        if (!busy) {
            clearInterval(tickTimer);
            tickTimer = null;
        }
    }

    function setAnimatorActive(animator, active) {
        if (!animator || animator.active === active) return;
        animator.active = active;
        if (active && !reducedMotion && !tickTimer) {
            tickTimer = setInterval(tick, 140);
        }
        if (!active) animator.rest?.();
    }

    function registerAnimator(animator) {
        animator.active = false;
        animators.add(animator);
        return animator;
    }

    // Per-sprite animations (stops + quests). Each returns { step(frame), rest() }.
    const spriteAnimations = {
        windmill(canvas) {
            return {
                step: frame => repaint(canvas, ctx => paint(ctx, SPRITES[frame % 4 < 2 ? 'windmill' : 'windmill_b'])),
                rest: () => repaint(canvas, ctx => paint(ctx, SPRITES.windmill))
            };
        },
        liberty(canvas) {
            return {
                step: frame => repaint(canvas, ctx => paint(ctx, SPRITES.liberty, 0, 0, frame % 2 ? { y: 'o', o: 'y' } : null)),
                rest: () => repaint(canvas, ctx => paint(ctx, SPRITES.liberty))
            };
        },
        tea(canvas) {
            const cup = SPRITES.tea.map((row, y) => (y < 5 ? '.'.repeat(row.length) : row));
            const steam = SPRITES.tea.slice(0, 5);
            return {
                step: frame => repaint(canvas, ctx => {
                    paint(ctx, cup);
                    paint(ctx, steam, frame % 4 < 2 ? 0 : 1, frame % 2 ? 0 : -1);
                }),
                rest: () => repaint(canvas, ctx => paint(ctx, SPRITES.tea))
            };
        },
        citgo(canvas) {
            return {
                step: frame => repaint(canvas, ctx => paint(ctx, SPRITES.citgo, 0, 0, frame % 7 === 0 ? { R: '#7d2230' } : null)),
                rest: () => repaint(canvas, ctx => paint(ctx, SPRITES.citgo))
            };
        },
        climb(canvas) {
            const holds = [[1, 9], [3, 7], [6, 5], [8, 3], [10, 1], [10, 1]];
            return {
                step: frame => repaint(canvas, ctx => {
                    paint(ctx, SPRITES.climb);
                    const [x, y] = holds[frame % holds.length];
                    paint(ctx, SPRITES.climber, x, y);
                }),
                rest: () => repaint(canvas, ctx => {
                    paint(ctx, SPRITES.climb);
                    paint(ctx, SPRITES.climber, 1, 9);
                })
            };
        },
        tennis(canvas) {
            const arc = [[11, 1], [12, 4], [12, 8], [12, 11], [12, 8], [12, 4]];
            return {
                step: frame => repaint(canvas, ctx => {
                    paint(ctx, SPRITES.tennis);
                    const [x, y] = arc[frame % arc.length];
                    paint(ctx, SPRITES.ball, x, y);
                }),
                rest: () => repaint(canvas, ctx => {
                    paint(ctx, SPRITES.tennis);
                    paint(ctx, SPRITES.ball, 11, 1);
                })
            };
        },
        gamepad(canvas) {
            const buttons = ['r', 's', 'g', 'y'];
            return {
                step: frame => repaint(canvas, ctx => paint(ctx, SPRITES.gamepad, 0, 0, { [buttons[frame % 4]]: 'w' })),
                rest: () => repaint(canvas, ctx => paint(ctx, SPRITES.gamepad))
            };
        },
        robot(canvas) {
            return {
                step: frame => repaint(canvas, ctx => paint(ctx, SPRITES.robot, 0, 0, {
                    R: frame % 2 ? 'y' : 'R',
                    c: frame % 9 === 0 ? 'k' : 'c'
                })),
                rest: () => repaint(canvas, ctx => paint(ctx, SPRITES.robot))
            };
        },
        printer(canvas) {
            // frame + bed without the nozzle and the print, which are drawn per frame
            const shell = SPRITES.printer.map((row, y) => {
                if (y >= 3 && y <= 6) return row.slice(0, 2) + '.'.repeat(12) + row.slice(14);
                if (y >= 9 && y <= 11) return row.slice(0, 2) + '.'.repeat(12) + row.slice(14);
                return row;
            });
            const drawPrinter = phase => {
                const layers = Math.min(3, Math.floor(phase / 6));
                const sweep = (phase * 1.5) % 12;
                const nozzleX = 4 + Math.round(Math.abs(sweep - 6));
                return ctx => {
                    paint(ctx, shell);
                    ctx.fillStyle = PIXEL_PALETTE.L;
                    ctx.fillRect(2, 4, 12, 1);
                    ctx.fillStyle = PIXEL_PALETTE.s;
                    const widths = [[5, 6], [5, 6], [6, 4]];
                    for (let i = 0; i < layers; i++) {
                        const [x, w] = widths[i];
                        ctx.fillRect(x, 11 - i, w, 1);
                    }
                    ctx.fillStyle = PIXEL_PALETTE.o;
                    ctx.fillRect(nozzleX, 3, 2, 2);
                    ctx.fillStyle = PIXEL_PALETTE.D;
                    ctx.fillRect(nozzleX, 5, 2, 1);
                    ctx.fillStyle = PIXEL_PALETTE.R;
                    ctx.fillRect(nozzleX + 1, 6, 1, 1);
                };
            };
            return {
                step: frame => repaint(canvas, drawPrinter(frame % 24)),
                rest: () => repaint(canvas, drawPrinter(23))
            };
        }
    };

    function attachSpriteAnimation(canvas, spriteName) {
        const factory = spriteAnimations[spriteName];
        if (!factory) return null;
        const animation = factory(canvas);
        animation.rest();
        return registerAnimator(animation);
    }

    // -----------------------------------------------------------------
    //  Photo deck
    // -----------------------------------------------------------------
    function initDeck() {
        const deck = document.getElementById('aboutDeck');
        const stack = deck?.querySelector('[data-deck-stack]');
        const caption = deck?.querySelector('[data-deck-caption]');
        // the deck is parked (hidden) while the pixel portrait is up: don't load the photos
        if (!deck || !stack || !aboutPhotos.length || deck.closest('[hidden]')) return;

        const tilts = [-3.5, 2.8, -1.6, 4.2, -4.6, 1.4];
        let order = aboutPhotos.map((_, index) => index);
        let busy = false;

        const cards = aboutPhotos.map((photo, index) => {
            const figure = document.createElement('figure');
            figure.className = 'about-polaroid';
            figure.style.setProperty('--tilt', `${tilts[index % tilts.length]}deg`);
            const img = document.createElement('img');
            img.src = photo.src;
            img.alt = photo.alt;
            img.width = 720;
            img.height = 720;
            img.loading = 'lazy';
            img.decoding = 'async';
            img.draggable = false;
            const figcaption = document.createElement('figcaption');
            figcaption.textContent = photo.caption;
            figure.append(img, figcaption);
            stack.appendChild(figure);
            return figure;
        });

        function layout() {
            order.forEach((cardIndex, depth) => {
                const card = cards[cardIndex];
                card.style.setProperty('--depth', String(Math.min(depth, 3)));
                card.style.zIndex = String(cards.length - depth);
                card.classList.toggle('is-top', depth === 0);
                card.classList.toggle('is-buried', depth > 2);
                card.setAttribute('aria-hidden', String(depth !== 0));
            });
            const top = order[0];
            if (caption) {
                const hidden = document.createElement('span');
                hidden.className = 'about-visually-hidden';
                hidden.textContent = `${aboutPhotos[top].caption}, photo `;
                caption.replaceChildren(hidden, `${top + 1} / ${aboutPhotos.length}`);
            }
        }

        function throwTop(direction) {
            if (busy || cards.length < 2) return;
            busy = true;
            const card = cards[order[0]];
            card.classList.remove('is-dragging');
            card.style.transform = `translate(${direction * 130}%, -6%) rotate(${direction * 18}deg)`;
            card.style.opacity = '0';
            setTimeout(() => {
                order.push(order.shift());
                card.style.transition = 'none';
                card.style.transform = '';
                card.style.opacity = '';
                layout();
                void card.offsetWidth;
                card.style.transition = '';
                busy = false;
            }, reducedMotion ? 0 : 260);
        }

        function next() {
            throwTop(1);
        }

        function prev() {
            if (busy || cards.length < 2) return;
            busy = true;
            const card = cards[order[order.length - 1]];
            order.unshift(order.pop());
            card.style.transition = 'none';
            card.style.transform = 'translate(-130%, -6%) rotate(-18deg)';
            card.style.opacity = '0';
            layout();
            void card.offsetWidth;
            card.style.transition = '';
            card.style.transform = '';
            card.style.opacity = '';
            setTimeout(() => { busy = false; }, reducedMotion ? 0 : 260);
        }

        // drag / swipe the top card
        let drag = null;
        stack.addEventListener('pointerdown', event => {
            const card = event.target.closest('.about-polaroid.is-top');
            if (!card || busy) return;
            drag = { card, id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, dy: 0, t: performance.now() };
            card.setPointerCapture(event.pointerId);
            card.classList.add('is-dragging');
        });
        stack.addEventListener('pointermove', event => {
            if (!drag || event.pointerId !== drag.id) return;
            drag.dx = event.clientX - drag.x;
            drag.dy = event.clientY - drag.y;
            drag.card.style.transform = `translate(${drag.dx}px, ${drag.dy * 0.4}px) rotate(${drag.dx * 0.06}deg)`;
        });
        const endDrag = event => {
            if (!drag || event.pointerId !== drag.id) return;
            const { card, dx } = drag;
            const velocity = Math.abs(dx) / Math.max(1, performance.now() - drag.t);
            drag = null;
            card.classList.remove('is-dragging');
            if (Math.abs(dx) > 70 || velocity > 0.6) {
                throwTop(dx < 0 ? -1 : 1);
            } else {
                card.style.transform = '';
                if (Math.abs(dx) < 4) next(); // a tap flips to the next photo
            }
        };
        stack.addEventListener('pointerup', endDrag);
        stack.addEventListener('pointercancel', event => {
            if (!drag || event.pointerId !== drag.id) return;
            drag.card.classList.remove('is-dragging');
            drag.card.style.transform = '';
            drag = null;
        });

        deck.querySelector('[data-deck-next]')?.addEventListener('click', next);
        deck.querySelector('[data-deck-prev]')?.addEventListener('click', prev);
        deck.addEventListener('keydown', event => {
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                next();
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                prev();
            }
        });

        layout();
    }

    // -----------------------------------------------------------------
    //  World tour
    // -----------------------------------------------------------------
    function initTour() {
        const tour = document.getElementById('aboutTour');
        if (!tour) return;
        const pin = tour.querySelector('.about-tour__pin');
        const viewport = tour.querySelector('[data-tour-viewport]');
        const track = tour.querySelector('[data-tour-track]');
        const routeEl = tour.querySelector('[data-route]');
        const statusEl = tour.querySelector('[data-tour-status]');
        const dotsEl = tour.querySelector('[data-tour-dots]');
        const hintEl = tour.querySelector('[data-tour-hint]');
        const stopCount = aboutStops.length;
        const pinQuery = window.matchMedia('(min-width: 1024px)');
        section.classList.add('about-enhanced');

        // --- cards
        const stops = aboutStops.map((stop, index) => {
            const item = document.createElement('li');
            item.className = `about-stop${stop.night ? ' about-stop--night' : ''}${stop.note ? ' about-stop--wide' : ''}`;
            item.tabIndex = 0;
            item.setAttribute('role', 'group');
            item.dataset.index = String(index);
            item.setAttribute('aria-label', `Stop ${index + 1} of ${stopCount}: ${stop.country}. ${stop.title}`);
            item.style.setProperty('--sky-top', stop.sky[0]);
            item.style.setProperty('--sky-bottom', stop.sky[1]);
            item.style.setProperty('--ground', stop.ground);

            const scene = document.createElement('div');
            scene.className = 'about-stop__scene';
            const number = document.createElement('span');
            number.className = 'about-stop__num';
            number.textContent = String(index + 1).padStart(2, '0');
            const region = document.createElement('span');
            region.className = 'about-stop__region';
            region.textContent = stop.region;
            scene.append(number, region);
            for (let i = 0; i < 2; i++) {
                const cloud = document.createElement('span');
                cloud.className = `about-stop__${stop.night ? 'star' : 'cloud'} about-stop__${stop.night ? 'star' : 'cloud'}--${i + 1}`;
                cloud.setAttribute('aria-hidden', 'true');
                scene.appendChild(cloud);
            }

            let animator = null;
            if (stop.photo) {
                const photo = document.createElement('img');
                photo.className = 'about-stop__photo';
                photo.src = stop.photo;
                photo.alt = `${stop.country}: ${stop.title}`;
                photo.loading = 'lazy';
                photo.decoding = 'async';
                scene.appendChild(photo);
                scene.appendChild(createSpriteCanvas(stop.sprite, 'about-stop__badge'));
            } else {
                const sprite = createSpriteCanvas(stop.sprite, 'about-stop__sprite');
                scene.appendChild(sprite);
                animator = attachSpriteAnimation(sprite, stop.sprite);
            }
            const ground = document.createElement('span');
            ground.className = 'about-stop__ground';
            ground.setAttribute('aria-hidden', 'true');
            scene.appendChild(ground);

            const body = document.createElement('div');
            body.className = 'about-stop__body';
            const country = document.createElement('p');
            country.className = 'about-stop__country';
            country.textContent = `${stop.flag} ${stop.country}`;
            const title = document.createElement('p');
            title.className = 'about-stop__title';
            title.textContent = stop.title;
            body.append(country, title);
            if (stop.note) {
                const note = document.createElement('p');
                note.className = 'about-stop__note';
                note.textContent = stop.note;
                body.appendChild(note);
            }
            if (stop.stamp) {
                const stamp = document.createElement('span');
                stamp.className = 'about-stop__stamp';
                stamp.setAttribute('aria-label', `Bonus stamp: ${stop.stamp.join(', ')}`);
                stop.stamp.forEach(line => {
                    const span = document.createElement('span');
                    span.textContent = line;
                    stamp.appendChild(span);
                });
                body.appendChild(stamp);
            }

            item.append(scene, body);
            track.appendChild(item);
            return { item, animator };
        });

        // --- dots
        const dots = aboutStops.map((stop, index) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'about-tour__dot';
            dot.setAttribute('aria-label', `Stop ${index + 1}: ${stop.country}`);
            dot.addEventListener('click', () => goToStop(index));
            dotsEl.appendChild(dot);
            return dot;
        });

        // --- route (dotted flight path, waypoints, plane)
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.classList.add('about-route__svg');
        const todoPath = document.createElementNS(svgNS, 'path');
        todoPath.classList.add('about-route__todo');
        const donePath = document.createElementNS(svgNS, 'path');
        donePath.classList.add('about-route__done');
        svg.append(todoPath, donePath);
        routeEl.appendChild(svg);
        const pins = aboutStops.map((stop, index) => {
            const pinEl = document.createElement('span');
            pinEl.className = `about-route__pin${index % 2 ? ' is-high' : ''}`;
            const flag = document.createElement('span');
            flag.className = 'about-route__flag';
            flag.textContent = index === stopCount - 1 ? `${stop.flag}📍` : stop.flag;
            pinEl.appendChild(flag);
            routeEl.appendChild(pinEl);
            return pinEl;
        });
        const plane = createSpriteCanvas('plane', 'about-route__plane');
        routeEl.appendChild(plane);
        let pathLength = 0;

        function renderRoute() {
            const width = routeEl.clientWidth;
            const height = routeEl.clientHeight;
            if (!width || !height) return;
            const pad = Math.min(36, width * 0.05);
            const points = aboutStops.map((_, index) => [
                pad + (index * (width - pad * 2)) / (stopCount - 1),
                index % 2 ? height * 0.3 : height * 0.7
            ]);
            let d = `M ${points[0][0]} ${points[0][1]}`;
            for (let i = 1; i < points.length; i++) {
                const [x0, y0] = points[i - 1];
                const [x1, y1] = points[i];
                const half = (x1 - x0) / 2;
                d += ` C ${x0 + half} ${y0}, ${x1 - half} ${y1}, ${x1} ${y1}`;
            }
            svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
            svg.setAttribute('width', String(width));
            svg.setAttribute('height', String(height));
            todoPath.setAttribute('d', d);
            donePath.setAttribute('d', d);
            pathLength = donePath.getTotalLength();
            donePath.style.strokeDasharray = `${pathLength} ${pathLength}`;
            points.forEach(([x, y], index) => {
                pins[index].style.left = `${x}px`;
                pins[index].style.top = `${y}px`;
            });
        }

        // --- progress
        let mode = 'swipe';
        let maxShift = 0;
        let travel = 0;
        let pinTop = 96;
        let progress = 0;
        let activeIndex = -1;
        let tourVisible = false;

        function placePlane(p) {
            if (!pathLength) return;
            const at = p * pathLength;
            const point = donePath.getPointAtLength(at);
            const ahead = donePath.getPointAtLength(Math.min(pathLength, at + 2));
            const behind = donePath.getPointAtLength(Math.max(0, at - 2));
            const angle = Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * (180 / Math.PI);
            plane.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -50%) rotate(${angle}deg)`;
            donePath.style.strokeDashoffset = String(pathLength * (1 - p));
        }

        function setActive(index) {
            if (index === activeIndex) return;
            activeIndex = index;
            stops.forEach(({ item, animator }, i) => {
                const active = i === index;
                item.classList.toggle('is-active', active);
                setAnimatorActive(animator, active && tourVisible);
            });
            dots.forEach((dot, i) => {
                dot.classList.toggle('is-active', i === index);
                if (i === index) dot.setAttribute('aria-current', 'step');
                else dot.removeAttribute('aria-current');
            });
            const stop = aboutStops[index];
            if (statusEl) statusEl.textContent = `Stop ${index + 1} / ${stopCount} · ${stop.flag} ${stop.country}`;
        }

        function setProgress(p) {
            progress = clamp(p, 0, 1);
            placePlane(progress);
            pins.forEach((pinEl, i) => pinEl.classList.toggle('is-reached', i / (stopCount - 1) <= progress + 0.02));
            setActive(Math.round(progress * (stopCount - 1)));
            if (hintEl) {
                hintEl.textContent = progress > 0.97
                    ? 'Landed in Boston 📍'
                    : (mode === 'pin' ? 'Keep scrolling to fly →' : 'Swipe to fly →');
            }
        }

        function update() {
            if (mode === 'pin') {
                const rect = tour.getBoundingClientRect();
                const p = travel > 0 ? (pinTop - rect.top) / travel : 0;
                const clamped = clamp(p, 0, 1);
                track.style.transform = `translate3d(${-clamped * maxShift}px, 0, 0)`;
                setProgress(clamped);
            } else {
                const max = viewport.scrollWidth - viewport.clientWidth;
                setProgress(max > 0 ? viewport.scrollLeft / max : 0);
            }
        }

        function applyMode() {
            pinTop = (document.getElementById('topNav')?.offsetHeight || 80) + 16;
            tour.style.setProperty('--about-pin-top', `${pinTop}px`);
            tour.style.height = '';
            track.style.transform = '';
            // pinned mode sizes the panel to the screen, so it needs enough height for readable cards
            const wantPin = pinQuery.matches && !reducedMotion && window.innerHeight - pinTop >= 560;
            tour.classList.toggle('is-pinned', wantPin);
            if (wantPin && pin.offsetHeight > window.innerHeight - pinTop - 8) {
                // the panel wouldn't fit on screen while pinned; fall back to swiping
                tour.classList.remove('is-pinned');
            }
            mode = tour.classList.contains('is-pinned') ? 'pin' : 'swipe';
            // keep the viewport's side padding visible at both ends of the pinned slide
            const viewportStyle = getComputedStyle(viewport);
            const sidePadding = parseFloat(viewportStyle.paddingLeft) + parseFloat(viewportStyle.paddingRight);
            maxShift = Math.max(0, track.offsetWidth + sidePadding - viewport.clientWidth);
            travel = 0;
            if (mode === 'pin') {
                travel = maxShift;
                tour.style.height = `${pin.offsetHeight + travel}px`;
            }
            renderRoute();
            update();
        }

        function goToStop(index) {
            const p = index / (stopCount - 1);
            const behavior = reducedMotion ? 'auto' : 'smooth';
            if (mode === 'pin') {
                const top = tour.getBoundingClientRect().top + window.scrollY - pinTop + p * travel;
                window.scrollTo({ top, behavior });
            } else {
                const max = viewport.scrollWidth - viewport.clientWidth;
                viewport.scrollTo({ left: p * max, behavior });
            }
        }

        let queued = false;
        const schedule = () => {
            if (queued) return;
            queued = true;
            requestAnimationFrame(() => {
                queued = false;
                update();
            });
        };
        window.addEventListener('scroll', () => {
            if (mode === 'pin') schedule();
        }, { passive: true });
        viewport.addEventListener('scroll', () => {
            if (mode === 'swipe') schedule();
        }, { passive: true });

        let resizeTimer = null;
        const onResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(applyMode, 120);
        };
        window.addEventListener('resize', onResize);
        pinQuery.addEventListener?.('change', applyMode);
        if ('ResizeObserver' in window) {
            let lastWidth = 0;
            new ResizeObserver(entries => {
                const width = Math.round(entries[0].contentRect.width);
                if (width !== lastWidth) {
                    lastWidth = width;
                    onResize();
                }
            }).observe(viewport);
        }

        // keyboard: tab / arrow through the stops (keeps the pinned view in sync)
        track.addEventListener('focusin', event => {
            const item = event.target.closest('.about-stop');
            if (!item || mode !== 'pin') return;
            // focusing a card can scroll the clipped viewport itself; the slide is transform-driven
            viewport.scrollLeft = 0;
            const index = Number(item.dataset.index);
            if (index !== activeIndex) goToStop(index);
        });
        track.addEventListener('keydown', event => {
            const item = event.target.closest('.about-stop');
            if (!item) return;
            const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
            if (!step) return;
            event.preventDefault();
            const nextIndex = clamp(Number(item.dataset.index) + step, 0, stopCount - 1);
            stops[nextIndex].item.focus({ preventScroll: mode === 'pin' });
            if (mode === 'pin') goToStop(nextIndex);
        });

        // only animate sprites while the tour is on screen
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(entries => {
                tourVisible = entries[0].isIntersecting;
                stops.forEach(({ animator }, i) => setAnimatorActive(animator, tourVisible && i === activeIndex));
            }, { threshold: 0.15 }).observe(tour);
        }

        applyMode();
        // fonts and lazy images can change the panel height after first layout
        window.addEventListener('load', applyMode, { once: true });
        document.fonts?.ready?.then(applyMode);
    }

    // -----------------------------------------------------------------
    //  Side quests
    // -----------------------------------------------------------------
    function initQuests() {
        const grid = section.querySelector('[data-quests]');
        if (!grid) return;
        aboutQuests.forEach(quest => {
            const item = document.createElement('li');
            item.className = 'about-quest';
            item.style.setProperty('--tint-a', quest.tint[0]);
            item.style.setProperty('--tint-b', quest.tint[1]);

            const art = document.createElement('div');
            art.className = 'about-quest__art';
            const sprite = createSpriteCanvas(quest.sprite, `about-quest__sprite about-quest__sprite--${quest.sprite}`);
            art.appendChild(sprite);
            const animator = attachSpriteAnimation(sprite, quest.sprite)
                || registerAnimator({ step() {}, rest() {} }); // CSS-only animations (soccer)

            const body = document.createElement('div');
            body.className = 'about-quest__body';
            const title = document.createElement('h4');
            title.textContent = quest.title;
            const text = document.createElement('p');
            text.textContent = quest.text;
            body.append(title, text);
            if (quest.link) {
                const link = document.createElement('a');
                link.className = 'about-quest__action';
                link.href = quest.link.href;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = `${quest.link.label} ↗`;
                body.appendChild(link);
            } else if (quest.project) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'about-quest__action';
                button.textContent = `${quest.project.label} →`;
                button.addEventListener('click', () => {
                    if (typeof openProjectDialog === 'function') openProjectDialog(quest.project.id);
                });
                body.appendChild(button);
            }

            item.append(art, body);
            grid.appendChild(item);

            const setHot = hot => {
                item.classList.toggle('is-hot', hot && !reducedMotion);
                setAnimatorActive(animator, hot);
            };
            if (coarsePointer && 'IntersectionObserver' in window) {
                // no hover on touch screens: play while the card is on screen
                new IntersectionObserver(entries => setHot(entries[0].isIntersecting), { threshold: 0.6 }).observe(item);
            } else {
                item.addEventListener('pointerenter', () => setHot(true));
                item.addEventListener('pointerleave', () => setHot(item.contains(document.activeElement)));
                item.addEventListener('focusin', () => setHot(true));
                item.addEventListener('focusout', () => setHot(false));
            }
        });
    }

    initDeck();
    initTour();
    initQuests();
})();
