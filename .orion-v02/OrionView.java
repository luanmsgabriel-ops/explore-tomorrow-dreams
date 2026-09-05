package com.orion.auto;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;
import android.os.SystemClock;
import android.view.View;

import java.util.Random;

/**
 * Procedural ORION interface. No generated/static character image is used.
 * The entity is drawn in real time from energy contours, glows and particles.
 */
public final class OrionView extends View {
    public enum State { IDLE, LISTENING, THINKING, SPEAKING }

    private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint glow = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Random random = new Random(73L);
    private final float[] px = new float[150];
    private final float[] py = new float[150];
    private final float[] ps = new float[150];
    private final float[] pa = new float[150];

    private State state = State.IDLE;
    private float audioLevel = 0f;
    private long stateStarted = SystemClock.uptimeMillis();

    public OrionView(Context context) {
        super(context);
        setLayerType(View.LAYER_TYPE_SOFTWARE, null);
        for (int i = 0; i < px.length; i++) {
            px[i] = random.nextFloat();
            py[i] = random.nextFloat();
            ps[i] = 0.35f + random.nextFloat() * 1.7f;
            pa[i] = random.nextFloat() * 6.2831855f;
        }
    }

    public void setState(State next) {
        if (state != next) {
            state = next;
            stateStarted = SystemClock.uptimeMillis();
        }
        invalidate();
    }

    public State getState() { return state; }

    public void setAudioLevel(float rms) {
        audioLevel = clamp((rms + 2f) / 12f, 0f, 1f);
        invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        float w = getWidth();
        float h = getHeight();
        if (w <= 1f || h <= 1f) return;

        float t = (SystemClock.uptimeMillis() - stateStarted) / 1000f;
        float pulse = 0.5f + 0.5f * (float) Math.sin(t * speed());
        float energy = state == State.LISTENING ? Math.max(pulse, audioLevel) : pulse;

        drawBackground(canvas, w, h, energy);
        drawEnergyField(canvas, w, h, t, energy);
        drawEntity(canvas, w, h, t, energy);
        drawParticles(canvas, w, h, t, energy);
        drawReadabilityFade(canvas, w, h);
        postInvalidateDelayed(16L);
    }

    private float speed() {
        switch (state) {
            case LISTENING: return 6.2f;
            case THINKING: return 8.4f;
            case SPEAKING: return 6.8f;
            default: return 1.55f;
        }
    }

    private void drawBackground(Canvas canvas, float w, float h, float energy) {
        paint.setShader(new LinearGradient(0, 0, 0, h,
                new int[]{Color.rgb(2, 7, 21), Color.rgb(2, 13, 34), Color.rgb(0, 8, 22)},
                new float[]{0f, 0.48f, 1f}, Shader.TileMode.CLAMP));
        canvas.drawRect(0, 0, w, h, paint);
        paint.setShader(null);

        paint.setShader(new RadialGradient(w * .5f, h * .39f, Math.max(w, h) * .55f,
                new int[]{Color.argb(30 + (int) (25 * energy), 0, 170, 255),
                        Color.argb(12, 0, 65, 125), Color.TRANSPARENT},
                new float[]{0f, .48f, 1f}, Shader.TileMode.CLAMP));
        canvas.drawRect(0, 0, w, h, paint);
        paint.setShader(null);
    }

    private void drawEnergyField(Canvas canvas, float w, float h, float t, float energy) {
        float cx = w * .5f;
        float cy = h * (w > h ? .43f : .42f);
        float max = Math.min(w, h) * (w > h ? .60f : .62f);

        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(1f);
        for (int i = 0; i < 7; i++) {
            float r = max * (.24f + i * .075f) + (float) Math.sin(t * .7f + i) * 2f;
            int a = 18 + i * 5 + (state == State.THINKING ? (int) (18 * energy) : 0);
            paint.setColor(Color.argb(Math.min(80, a), 0, 175, 255));
            canvas.drawCircle(cx, cy, r, paint);
        }

        for (int side : new int[]{-1, 1}) {
            for (int lane = 0; lane < 5; lane++) {
                Path p = new Path();
                float y0 = cy + max * (.12f + lane * .055f);
                p.moveTo(cx + side * max * .20f, y0);
                float x1 = cx + side * max * .50f;
                float y1 = y0 - max * (.12f + lane * .015f);
                float x2 = cx + side * max * .92f;
                float y2 = y0 + max * (.04f + lane * .03f);
                float jitter = (float) Math.sin(t * 1.4f + lane * 1.7f) * max * .025f;
                p.cubicTo(x1, y1 + jitter, x1 + side * max * .18f, y2 - jitter, x2, y2);
                paint.setStrokeWidth(1.2f + lane * .25f);
                paint.setColor(Color.argb(48 + (int) (55 * energy), 0, 195, 255));
                glow.setStyle(Paint.Style.STROKE);
                glow.setStrokeWidth(4f + lane * .4f);
                glow.setColor(Color.argb(24 + (int) (38 * energy), 0, 190, 255));
                glow.setShadowLayer(14f + 10f * energy, 0, 0, Color.rgb(0, 210, 255));
                canvas.drawPath(p, glow);
                glow.clearShadowLayer();
                canvas.drawPath(p, paint);

                if (lane == 2) {
                    Path amber = new Path();
                    amber.moveTo(cx + side * max * .28f, y0 + max * .08f);
                    amber.cubicTo(cx + side * max * .52f, y0 - max * .01f,
                            cx + side * max * .68f, y0 + max * .15f,
                            cx + side * max * .88f, y0 + max * .10f);
                    paint.setStrokeWidth(1.4f + energy);
                    paint.setColor(Color.argb(70 + (int) (75 * energy), 255, 151, 42));
                    canvas.drawPath(amber, paint);
                }
            }
        }
        paint.setStyle(Paint.Style.FILL);
    }

    private void drawEntity(Canvas canvas, float w, float h, float t, float energy) {
        boolean landscape = w > h;
        float cx = w * .5f;
        float cy = h * (landscape ? .41f : .40f);
        float scale = landscape ? Math.min(h * .76f, w * .44f) : w * .92f;

        float headW = scale * .43f;
        float headH = headW * 1.36f;
        float top = cy - headH * .55f;
        float chin = cy + headH * .52f;
        float shoulderY = chin + headH * .30f;
        float shoulderHalf = scale * .50f;
        float chestBottom = shoulderY + headH * .70f;

        int hotCyan = Color.rgb(0, 231, 255);
        int amber = Color.rgb(255, 139, 22);

        Path outline = new Path();
        outline.moveTo(cx, top);
        outline.cubicTo(cx - headW * .53f, top + headH * .02f,
                cx - headW * .60f, cy + headH * .17f,
                cx - headW * .30f, chin);
        outline.cubicTo(cx - scale * .10f, chin + headH * .12f,
                cx - shoulderHalf * .55f, shoulderY - headH * .03f,
                cx - shoulderHalf, shoulderY + headH * .28f);
        outline.moveTo(cx, top);
        outline.cubicTo(cx + headW * .53f, top + headH * .02f,
                cx + headW * .60f, cy + headH * .17f,
                cx + headW * .30f, chin);
        outline.cubicTo(cx + scale * .10f, chin + headH * .12f,
                cx + shoulderHalf * .55f, shoulderY - headH * .03f,
                cx + shoulderHalf, shoulderY + headH * .28f);

        glow.setStyle(Paint.Style.STROKE);
        glow.setStrokeCap(Paint.Cap.ROUND);
        glow.setStrokeJoin(Paint.Join.ROUND);
        glow.setStrokeWidth(5.5f + 2.4f * energy);
        glow.setColor(Color.argb(155 + (int) (70 * energy), 0, 205, 255));
        glow.setShadowLayer(24f + 22f * energy, 0, 0, hotCyan);
        canvas.drawPath(outline, glow);
        glow.clearShadowLayer();

        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeCap(Paint.Cap.ROUND);
        int faceLines = 42;
        for (int i = 0; i < faceLines; i++) {
            float p = i / (float) (faceLines - 1);
            float yy = top + headH * (.06f + p * .88f);
            float unit = 2f * p - 1f;
            float ellipse = (float) Math.sqrt(Math.max(0f, 1f - unit * unit));
            float half = headW * (.17f + .34f * ellipse);
            float localWave = (float) Math.sin(t * 2.0f + i * .53f) * headW * .016f;
            float voiceWave = state == State.SPEAKING ? (float) Math.sin(t * 10f + i * .42f) * headW * .020f * energy : 0f;
            Path line = new Path();
            line.moveTo(cx - half, yy);
            line.cubicTo(cx - half * .46f, yy + localWave + voiceWave,
                    cx + half * .46f, yy - localWave - voiceWave,
                    cx + half, yy);
            int a = 80 + (int) (85 * energy);
            paint.setStrokeWidth(.75f + .8f * energy);
            paint.setColor(Color.argb(Math.min(205, a), 28, 207, 255));
            canvas.drawPath(line, paint);
        }

        float maskW = headW * .73f;
        float maskH = headH * .49f;
        float maskY = cy + headH * .01f;
        RectF maskRect = new RectF(cx - maskW * .5f, maskY - maskH * .5f,
                cx + maskW * .5f, maskY + maskH * .5f);
        paint.setStyle(Paint.Style.FILL);
        paint.setShader(new RadialGradient(cx, maskY, Math.max(maskW, maskH) * .68f,
                new int[]{Color.argb(245, 255, 177, 52), Color.argb(225, 255, 106, 0),
                        Color.argb(72, 255, 80, 0), Color.TRANSPARENT},
                new float[]{0f, .42f, .72f, 1f}, Shader.TileMode.CLAMP));
        paint.setShadowLayer(25f + 28f * energy, 0, 0, amber);
        canvas.drawOval(maskRect, paint);
        paint.clearShadowLayer();
        paint.setShader(null);

        paint.setStyle(Paint.Style.STROKE);
        int amberLines = 18;
        for (int i = 0; i < amberLines; i++) {
            float p = i / (float) (amberLines - 1);
            float yy = maskY - maskH * .41f + p * maskH * .82f;
            float unit = 2f * p - 1f;
            float half = maskW * .47f * (float) Math.sqrt(Math.max(0f, 1f - unit * unit));
            float amp = headW * (.018f + .020f * energy);
            float wave = (float) Math.sin(t * (state == State.SPEAKING ? 8.0f : 2.2f) + i * .75f) * amp;
            Path band = new Path();
            band.moveTo(cx - half, yy);
            band.cubicTo(cx - half * .4f, yy + wave, cx + half * .4f, yy - wave, cx + half, yy);
            paint.setStrokeWidth(1.2f + 1.1f * energy);
            paint.setColor(Color.argb(150 + (int) (80 * energy), 255, 182, 74));
            canvas.drawPath(band, paint);
        }

        for (int i = 0; i < 14; i++) {
            float q = i / 13f;
            float y = chin + q * (shoulderY - chin + headH * .11f);
            float half = headW * (.29f - q * .12f);
            paint.setStrokeWidth(.8f + (1f - q) * .7f);
            paint.setColor(Color.argb(75 + (int) (65 * energy), 30, 205, 255));
            Path n = new Path();
            n.moveTo(cx - half, y);
            n.quadTo(cx, y + headH * .025f, cx + half, y);
            canvas.drawPath(n, paint);
        }

        int chestLines = 24;
        for (int i = 0; i < chestLines; i++) {
            float q = i / (float) (chestLines - 1);
            float y = shoulderY + q * (chestBottom - shoulderY);
            float reach = shoulderHalf * (.33f + .67f * q);
            float centerDrop = headH * (.045f + q * .15f);
            paint.setStrokeWidth(.7f + (1f - q) * .8f);
            paint.setColor(Color.argb(50 + (int) (70 * energy), 23, 196, 255));

            Path left = new Path();
            left.moveTo(cx, y - centerDrop);
            left.cubicTo(cx - reach * .26f, y - headH * .09f,
                    cx - reach * .58f, y - headH * .02f,
                    cx - reach, y + headH * .08f);
            canvas.drawPath(left, paint);

            Path right = new Path();
            right.moveTo(cx, y - centerDrop);
            right.cubicTo(cx + reach * .26f, y - headH * .09f,
                    cx + reach * .58f, y - headH * .02f,
                    cx + reach, y + headH * .08f);
            canvas.drawPath(right, paint);
        }

        glow.setStyle(Paint.Style.STROKE);
        glow.setStrokeCap(Paint.Cap.ROUND);
        glow.setStrokeWidth(2.2f + 1.9f * energy);
        glow.setColor(Color.argb(160 + (int) (80 * energy), 255, 162, 45));
        glow.setShadowLayer(14f + 14f * energy, 0, 0, amber);
        Path neural = new Path();
        neural.moveTo(cx, chin - headH * .05f);
        neural.cubicTo(cx - headW * .05f, chin + headH * .12f,
                cx - headW * .13f, shoulderY + headH * .02f,
                cx - headW * .02f, shoulderY + headH * .22f);
        neural.moveTo(cx, chin - headH * .05f);
        neural.cubicTo(cx + headW * .05f, chin + headH * .12f,
                cx + headW * .13f, shoulderY + headH * .02f,
                cx + headW * .02f, shoulderY + headH * .22f);
        neural.moveTo(cx, shoulderY + headH * .18f);
        neural.lineTo(cx, chestBottom - headH * .06f);
        canvas.drawPath(neural, glow);
        glow.clearShadowLayer();

        if (state == State.LISTENING || state == State.THINKING) {
            paint.setStyle(Paint.Style.STROKE);
            for (int i = 0; i < 3; i++) {
                float r = headW * (.66f + i * .15f + .018f * energy);
                paint.setStrokeWidth(1.0f + .2f * i);
                paint.setColor(Color.argb(50 + i * 16 + (int) (35 * energy), 0, 211, 255));
                canvas.drawCircle(cx, cy, r, paint);
            }
        }
        paint.setStyle(Paint.Style.FILL);
    }

    private void drawParticles(Canvas canvas, float w, float h, float t, float energy) {
        float cx = w * .5f;
        float cy = h * (w > h ? .43f : .43f);
        float maxR = Math.min(w, h) * .72f;
        for (int i = 0; i < px.length; i++) {
            float angle = pa[i] + t * (.018f + ps[i] * .018f);
            float radius = maxR * (.12f + py[i] * .90f);
            float x = cx + (float) Math.cos(angle) * radius * (w > h ? 1.55f : .92f);
            float y = cy + (float) Math.sin(angle) * radius * .82f;
            int a = 20 + (int) (85 * energy * ps[i] / 2.05f);
            boolean amber = i % 17 == 0;
            paint.setColor(amber
                    ? Color.argb(Math.min(135, a), 255, 155, 43)
                    : Color.argb(Math.min(150, a), 18, 202, 255));
            canvas.drawCircle(x, y, .55f + ps[i] * .78f, paint);
        }
    }

    private void drawReadabilityFade(Canvas canvas, float w, float h) {
        paint.setShader(new LinearGradient(0, 0, 0, h,
                new int[]{Color.argb(75, 1, 7, 18), Color.TRANSPARENT, Color.TRANSPARENT, Color.argb(238, 1, 7, 18)},
                new float[]{0f, .12f, .66f, .88f}, Shader.TileMode.CLAMP));
        canvas.drawRect(0, 0, w, h, paint);
        paint.setShader(null);
    }

    private float clamp(float value, float min, float max) {
        return Math.max(min, Math.min(max, value));
    }
}
