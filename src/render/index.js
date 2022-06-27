import * as PIXI from 'pixi.js-legacy';

export default class Render
{
    constructor(params)
    {
        if (!params.texture) throw new Error('Render must use a texture object for creating sprites.');

        this.chart = null;
        this.music = null;
        this.bg = null;

        this.noteScale = !isNaN(Number(params.noteScale)) ? Number(params.noteScale) : 8000;
        this.audioOffset = 0;
        
        this.pixi = new PIXI.Application({
            width       : !isNaN(Number(params.width)) ? Number(params.width) : document.documentElement.clientWidth,
            height      : !isNaN(Number(params.height)) ? Number(params.height) : document.documentElement.clientHeight,
            resolution  : !isNaN(Number(params.resolution)) ? Number(params.resolution) : window.devicePixelRatio,
            autoDensity : params.autoDensity instanceof Boolean ? params.autoDensity : true,
            antialias   : params.antialias instanceof Boolean ? params.antialias : true,
            forceCanvas : params.forceCanvas instanceof Boolean ? params.forceCanvas : false,
            view        : params.canvas ? params.canvas : undefined,
            resizeTo    : params.resizeTo ? params.resizeTo : (params.canvas ? params.canvas.parentElement : undefined)
        });

        this.texture = params.texture;
        this.zipFiles = params.zipFiles;

        this.sprites = {};
        this.audioContext = undefined;

        this.resize();
        window.addEventListener('resize', () => { this.resize() });

        this.tick = this.tick.bind(this);
    }

    static from (params)
    {
        if (!params) throw new Error('Please input an argument');
        if (!params.chart) throw new Error('You must input a chart');
        if (!params.music) throw new Error('You must input a music');
        if (!params.bg) throw new Error('You must input a bg');
        if (!params.render || !params.render.canvas) throw new Error('You must input a canvas as stage');

        let render = new Render(params.render);

        render.chart = params.chart;
        render.music = params.music;
        render.bg = params.bg;



        return render;
    }

    createSprites()
    {
        // this.sprites.mainContainer = new PIXI.Container();

        this.chart.judgelines.forEach((judgeline, index) =>
        {
            judgeline.createSprite(this.texture, this.zipFiles);

            judgeline.sprite.height = this.pixi.renderer.lineScale * 18.75 * 0.008;
            judgeline.sprite.width = judgeline.sprite.height * judgeline.sprite.texture.width / judgeline.sprite.texture.height * 1.042;

            judgeline.sprite.position.x = this.pixi.screen.width / 2;
            judgeline.sprite.position.y = this.pixi.screen.height / 2;
            judgeline.sprite.zIndex = index + 1;

            this.pixi.stage.addChild(judgeline.sprite);
            // this.sprites.mainContainer.addChild(judgeline.sprite);
        });

        this.chart.notes.forEach((note, index) =>
        {
            note.createSprite(this.texture, this.zipFiles);

            if (note.type === 3)
            {
                note.sprite.children[1].height = note.holdLength * this.pixi.renderer.noteSpeed / this.pixi.renderer.noteScale;
                note.sprite.children[2].position.y = -(note.holdLength * this.pixi.renderer.noteSpeed / this.pixi.renderer.noteScale);
            }

            note.sprite.scale.set(this.pixi.renderer.noteScale);
            note.sprite.zIndex = this.chart.judgelines.length + (note.type === 3 ? index : index + 10);

            this.pixi.stage.addChild(note.sprite);
            // this.sprites.mainContainer.addChild(note.sprite);
        });
    }

    async start()
    {
        this.audioContext = this.music.play();
        this.pixi.ticker.add(this.tick);
    }

    tick()
    {
        let currentTime = (this.audioContext.progress * this.music.duration) + this.audioOffset + this.chart.offset;
        this.chart.calcTime(currentTime, this.pixi);
    }
    
    resize()
    {
        if (!this.pixi) return;

        this.pixi.renderer.fixedWidth = (this.pixi.resizeTo.clientHeight / 9 * 16 < this.pixi.resizeTo.clientWidth ? this.pixi.resizeTo.clientHeight / 9 * 16 : this.pixi.resizeTo.clientWidth);
        this.pixi.renderer.fixedWidthOffset = this.pixi.resizeTo.clientWidth - this.pixi.renderer.fixedWidth;

        this.pixi.renderer.noteSpeed = this.pixi.resizeTo.clientHeight * 0.6;
        this.pixi.renderer.noteScale = this.pixi.renderer.fixedWidth / this.noteScale;
        this.pixi.renderer.lineScale = this.pixi.renderer.fixedWidth > this.pixi.resizeTo.clientHeight * 0.75 ? this.pixi.resizeTo.clientHeight / 18.75 : this.pixi.renderer.fixedWidth / 14.0625;

        if (this.chart)
        {
            if (this.chart.judgelines && this.chart.judgelines.length > 0)
            {
                this.chart.judgelines.forEach((judgeline) =>
                {
                    if (!judgeline.sprite) return;

                    judgeline.sprite.height = this.pixi.renderer.lineScale * 18.75 * 0.008;
                    judgeline.sprite.width = judgeline.sprite.height * judgeline.sprite.texture.width / judgeline.sprite.texture.height * 1.042;
                });
            }

            if (this.chart.notes && this.chart.notes.length > 0)
            {
                this.chart.notes.forEach((note) =>
                {
                    if (note.type === 3)
                    {
                        note.sprite.children[1].height = note.holdLength * this.pixi.renderer.noteSpeed / this.pixi.renderer.noteScale;
                        note.sprite.children[2].position.y = -(note.holdLength * this.pixi.renderer.noteSpeed / this.pixi.renderer.noteScale);
                    }

                    note.sprite.scale.set(this.pixi.renderer.noteScale);
                });
            }
        }
    }
};