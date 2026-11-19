import { Application, Graphics } from 'pixi.js';
import './style.css'

async function boot(): Promise<void> {
    const app = new Application()

    await app.init({
        resizeTo: window,
        background: "#000000",
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio, 2),
    })

    document.getElementById('app')!.appendChild(app.canvas);

    const box = new Graphics()
        .rect(-0, -0, 120, 120)
        .fill('#ff8a3d');
    app.stage.addChild(box);
    box.pivot.set(box.width / 2, box.height / 2)
    box.position.set(app.screen.width / 2, app.screen.height / 2 )
    app.ticker.add((ticker) => {
        box.rotation += 0.05 * ticker.deltaTime;
    });
}

boot()