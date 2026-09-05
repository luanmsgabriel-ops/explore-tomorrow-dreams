package com.orion.auto;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
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
 * ORION v0.3 visual engine.
 *
 * The user-supplied approved humanoid reference is used as the exact visual base.
 * Runtime Canvas effects are layered over it so the character stays visually faithful
 * while still reacting to LISTENING / THINKING / SPEAKING states.
 */
public final class OrionView extends View {
    public enum State { IDLE, LISTENING, THINKING, SPEAKING }

    private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
    private final Paint glow = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Random random = new Random(1403L);
    private final float[] particleAngle = new float[180];
    private final float[] particleRadius = new float[180];
    private final float[] particleSize = new float[180];
    private final float[] particlePhase = new float[180];
    private final Bitmap reference;

    private State state = State.IDLE;
    private float audioLevel = 0f;
    private long stateStarted = SystemClock.uptimeMillis();

    private final RectF imageRect = new RectF();
    private final RectF faceRect = new RectF();

    public OrionView(Context context) {
        super(context);
        setLayerType(View.LAYER_TYPE_SOFTWARE, null);
        reference = BitmapFactory.decodeResource(getResources(), R.drawable.orion_reference);
        for (int i = 0; i < particleAngle.length; i++) {
            particleAngle[i] = random.nextFloat() * 6.2831855f;
            particleRadius[i] = .18f + random.nextFloat() * .88f;
            particleSize[i] = .45f + random.nextFloat() * 2.2f;
            particlePhase[i] = random.nextFloat() * 8f;
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
        if (w <= 1f || h <= 1f || reference == null) return;

        float t = (SystemClock.uptimeMillis() - stateStarted) / 1000f;
        float idleBreath = .5f + .5f * (float) Math.sin(t * 1.35f);
        float reactive = state == State.LISTENING ? Math.max(audioLevel, idleBreath) : idleBreath;
        float speechEnergy = state == State.SPEAKING ? speechEnvelope(t) : 0f;
        float energy = Math.max(reactive * .74f, speechEnergy);

        drawBackground(canvas, w, h, energy);
        calculateGeometry(w, h, t, speechEnergy);
        drawReference(canvas, speechEnergy);
        drawStateField(canvas, t, energy, speechEnergy);
        if (state == State.SPEAKING) drawSpeakingEffects(canvas, t, speechEnergy);
        else if (state == State.LISTENING) drawListeningEffects(canvas, t, reactive);
        else if (state == State.THINKING) drawThinkingEffects(canvas, t);
        drawAmbientParticles(canvas, w, h, t, energy, speechEnergy);
        drawReadabilityFade(canvas, w, h);
        postInvalidateDelayed(16L);
    }

    private void calculateGeometry(float w, float h, float t, float speechEnergy) {
        boolean landscape = w > h;
        float targetWidth;
        float top;
        if (landscape) {
            targetWidth = Math.min(w * .56f, h * .92f * reference.getWidth() / (float) reference.getHeight());
            top = h * .07f;
        } else {
            targetWidth = w * 1.02f;
            top = h * .125f;
        }
        float breath = state == State.IDLE ? .0045f * (float) Math.sin(t * 1.35f) : 0f;
        float talkPulse = state == State.SPEAKING ? .010f * speechEnergy : 0f;
        targetWidth *= 1f + breath + talkPulse;
        float targetHeight = targetWidth * reference.getHeight() / (float) reference.getWidth();
        float left = (w - targetWidth) * .5f;
        imageRect.set(left, top, left + targetWidth, top + targetHeight);
        faceRect.set(mapX(171f), mapY(315f), mapX(610f), mapY(668f));
    }

    private float mapX(float sourceX) {
        return imageRect.left + sourceX / 780f * imageRect.width();
    }

    private float mapY(float sourceY) {
        return imageRect.top + sourceY / 1147f * imageRect.height();
    }

    private void drawBackground(Canvas canvas, float w, float h, float energy) {
        paint.setStyle(Paint.Style.FILL);
        paint.setShader(new LinearGradient(0, 0, 0, h,
                new int[]{Color.rgb(1, 5, 16), Color.rgb(2, 10, 26), Color.rgb(0, 5, 15)},
                new float[]{0f, .52f, 1f}, Shader.TileMode.CLAMP));
        canvas.drawRect(0, 0, w, h, paint);
        paint.setShader(null);
        paint.setShader(new RadialGradient(w * .5f, h * .39f, Math.max(w, h) * .58f,
                new int[]{Color.argb(32 + (int)(32f * energy), 0, 139, 219),
                        Color.argb(12, 0, 52, 105), Color.TRANSPARENT},
                new float[]{0f, .45f, 1f}, Shader.TileMode.CLAMP));
        canvas.drawRect(0, 0, w, h, paint);
        paint.setShader(null);
    }

    private void drawReference(Canvas canvas, float speechEnergy) {
        paint.setStyle(Paint.Style.FILL);
        paint.setAlpha(state == State.SPEAKING ? 255 : state == State.THINKING ? 248 : 242);
        canvas.drawBitmap(reference, null, imageRect, paint);
        paint.setAlpha(255);
        if (state != State.IDLE || speechEnergy > 0f) {
            float cx = faceRect.centerX();
            float cy = faceRect.centerY();
            float radius = faceRect.width() * (.68f + .05f * speechEnergy);
            glow.setStyle(Paint.Style.STROKE);
            glow.setStrokeWidth(1.8f + 2.8f * speechEnergy);
            glow.setColor(Color.argb(45 + (int)(110f * speechEnergy), 0, 220, 255));
            glow.setShadowLayer(18f + 26f * speechEnergy, 0, 0, Color.rgb(0, 217, 255));
            canvas.drawCircle(cx, cy - faceRect.height() * .12f, radius, glow);
            glow.clearShadowLayer();
        }
    }

    private void drawStateField(Canvas canvas, float t, float energy, float speechEnergy) {
        float cx = faceRect.centerX();
        float cy = faceRect.centerY() - faceRect.height() * .16f;
        float base = faceRect.width() * .69f;
        int ringCount = state == State.SPEAKING ? 5 : state == State.THINKING ? 4 : 3;
        paint.setStyle(Paint.Style.STROKE);
        for (int i = 0; i < ringCount; i++) {
            float expansion = state == State.SPEAKING ? speechEnergy * faceRect.width() * .10f : energy * 3.5f;
            float r = base + i * faceRect.width() * .14f + expansion;
            int a = 15 + i * 8;
            if (state == State.THINKING) a += 24;
            if (state == State.SPEAKING) a += (int)(48f * speechEnergy);
            paint.setStrokeWidth(.8f + i * .15f);
            paint.setColor(Color.argb(Math.min(110, a), 0, 188, 255));
            canvas.drawCircle(cx, cy, r, paint);
        }
        paint.setStyle(Paint.Style.FILL);
    }

    private void drawListeningEffects(Canvas canvas, float t, float energy) {
        float cx = faceRect.centerX();
        float cy = faceRect.centerY();
        float r = faceRect.width() * (.53f + .06f * energy);
        glow.setStyle(Paint.Style.STROKE);
        glow.setStrokeWidth(2f + 2f * energy);
        glow.setColor(Color.argb(75 + (int)(95f * energy), 0, 225, 255));
        glow.setShadowLayer(18f + 18f * energy, 0, 0, Color.rgb(0, 230, 255));
        canvas.drawOval(new RectF(cx-r, cy-r*.76f, cx+r, cy+r*.76f), glow);
        glow.clearShadowLayer();
        paint.setStyle(Paint.Style.STROKE);
        for (int i = 0; i < 9; i++) {
            float p = i / 8f;
            float yy = faceRect.top + faceRect.height() * (.18f + .64f * p);
            float wave = (float)Math.sin(t * 9f + i * .8f) * 4f * energy;
            paint.setStrokeWidth(1.2f + energy);
            paint.setColor(Color.argb(70 + (int)(90f * energy), 0, 224, 255));
            canvas.drawLine(faceRect.left - 14f - wave, yy, faceRect.left - 2f, yy, paint);
            canvas.drawLine(faceRect.right + 2f, yy, faceRect.right + 14f + wave, yy, paint);
        }
        paint.setStyle(Paint.Style.FILL);
    }

    private void drawThinkingEffects(Canvas canvas, float t) {
        float cx = faceRect.centerX();
        float cy = faceRect.centerY() - faceRect.height() * .12f;
        paint.setStyle(Paint.Style.STROKE);
        for (int i = 0; i < 3; i++) {
            float r = faceRect.width() * (.73f + i * .18f);
            RectF oval = new RectF(cx-r, cy-r*.72f, cx+r, cy+r*.72f);
            paint.setStrokeWidth(1.4f + i * .35f);
            paint.setColor(Color.argb(70 - i * 12, 0, 210, 255));
            float start = (t * (55f + i * 23f) + i * 80f) % 360f;
            canvas.drawArc(oval, start, 92f + i * 24f, false, paint);
            canvas.drawArc(oval, start + 180f, 55f + i * 16f, false, paint);
        }
        paint.setStyle(Paint.Style.FILL);
    }

    private void drawSpeakingEffects(Canvas canvas, float t, float e) {
        float cx = faceRect.centerX();
        float cy = faceRect.centerY();
        Path clip = new Path();
        clip.addOval(faceRect, Path.Direction.CW);
        int save = canvas.save();
        canvas.clipPath(clip);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeCap(Paint.Cap.ROUND);
        int lines = 24;
        for (int i = 0; i < lines; i++) {
            float p = i / (float)(lines - 1);
            float yy = faceRect.top + faceRect.height() * (.10f + .80f * p);
            float unit = 2f * p - 1f;
            float half = faceRect.width() * .47f * (float)Math.sqrt(Math.max(0f, 1f - unit * unit));
            float amp = (4.5f + 13f * e) * (0.55f + .45f * (float)Math.sin(t * 2.6f + i * .21f));
            float w1 = (float)Math.sin(t * 13.6f + i * .72f) * amp;
            float w2 = (float)Math.sin(t * 19.4f + i * .37f + 1.2f) * amp * .45f;
            Path band = new Path();
            band.moveTo(cx-half, yy);
            band.cubicTo(cx-half*.52f, yy+w1, cx+half*.52f, yy-w1+w2, cx+half, yy+w2*.2f);
            paint.setStrokeWidth(1.1f + 2.2f * e);
            paint.setColor(Color.argb(Math.min(245, 125 + (int)(120f * e)), 255, 185, 86));
            canvas.drawPath(band, paint);
        }
        canvas.restoreToCount(save);

        paint.setStyle(Paint.Style.FILL);
        float pulseR = faceRect.width() * (.43f + .065f * e);
        paint.setShader(new RadialGradient(cx, cy, pulseR,
                new int[]{Color.argb(42 + (int)(75f * e), 255, 197, 89),
                        Color.argb(24 + (int)(90f * e), 255, 104, 0), Color.TRANSPARENT},
                new float[]{0f, .50f, 1f}, Shader.TileMode.CLAMP));
        canvas.drawOval(new RectF(cx-pulseR, cy-pulseR*.78f, cx+pulseR, cy+pulseR*.78f), paint);
        paint.setShader(null);

        float headCx = mapX(390f);
        float headCy = mapY(350f);
        float headRx = imageRect.width() * .32f;
        float headRy = imageRect.height() * .30f;
        glow.setStyle(Paint.Style.STROKE);
        glow.setStrokeWidth(2.5f + 5.5f * e);
        glow.setColor(Color.argb(82 + (int)(120f * e), 0, 225, 255));
        glow.setShadowLayer(22f + 38f * e, 0, 0, Color.rgb(0, 224, 255));
        canvas.drawOval(new RectF(headCx-headRx, headCy-headRy, headCx+headRx, headCy+headRy), glow);
        glow.clearShadowLayer();

        drawShoulderBursts(canvas, t, e);

        float chestX = mapX(390f);
        float yStart = mapY(720f);
        float yEnd = mapY(1082f);
        float travel = (t * .72f) % 1f;
        float y = yStart + (yEnd - yStart) * travel;
        glow.setStyle(Paint.Style.STROKE);
        glow.setStrokeCap(Paint.Cap.ROUND);
        glow.setStrokeWidth(2.2f + 3.0f * e);
        glow.setColor(Color.argb(120 + (int)(120f * e), 255, 169, 58));
        glow.setShadowLayer(16f + 22f * e, 0, 0, Color.rgb(255, 126, 0));
        canvas.drawLine(chestX, Math.max(yStart, y-42f), chestX, Math.min(yEnd, y+60f), glow);
        glow.clearShadowLayer();
        paint.setStyle(Paint.Style.FILL);
    }

    private void drawShoulderBursts(Canvas canvas, float t, float e) {
        float cy = mapY(710f);
        float cx = imageRect.centerX();
        float reach = getWidth() * .58f;
        for (int side : new int[]{-1, 1}) {
            for (int lane = 0; lane < 5; lane++) {
                float y0 = cy + lane * imageRect.height() * .022f;
                float jitter = (float)Math.sin(t * (4.8f + lane * .34f) + lane * .8f) * (8f + 18f * e);
                Path p = new Path();
                p.moveTo(cx + side * imageRect.width() * .27f, y0);
                p.cubicTo(cx + side * reach * .42f, y0 - 45f - jitter,
                        cx + side * reach * .72f, y0 + 20f + jitter,
                        cx + side * reach, y0 - 6f + jitter*.25f);
                glow.setStyle(Paint.Style.STROKE);
                glow.setStrokeCap(Paint.Cap.ROUND);
                glow.setStrokeWidth(1.3f + lane * .25f + e * 1.7f);
                glow.setColor(Color.argb(72 + (int)(110f * e), 0, 222, 255));
                glow.setShadowLayer(12f + 20f * e, 0, 0, Color.rgb(0, 218, 255));
                canvas.drawPath(p, glow);
                glow.clearShadowLayer();
                if (lane == 2) {
                    paint.setStyle(Paint.Style.STROKE);
                    paint.setStrokeWidth(1.2f + 1.4f * e);
                    paint.setColor(Color.argb(70 + (int)(100f * e), 255, 159, 49));
                    canvas.drawPath(p, paint);
                }
            }
        }
        paint.setStyle(Paint.Style.FILL);
    }

    private void drawAmbientParticles(Canvas canvas, float w, float h, float t, float energy, float speechEnergy) {
        float cx = faceRect.centerX();
        float cy = faceRect.centerY() - faceRect.height() * .10f;
        float maxR = Math.min(w, h) * .70f;
        boolean talking = state == State.SPEAKING;
        for (int i = 0; i < particleAngle.length; i++) {
            float speed = talking ? .13f + particleSize[i] * .045f : .018f + particleSize[i] * .013f;
            float angle = particleAngle[i] + t * speed;
            float burst = talking ? (1f + .22f * speechEnergy * (float)Math.sin(t * 5f + particlePhase[i])) : 1f;
            float radius = maxR * particleRadius[i] * burst;
            float x = cx + (float)Math.cos(angle) * radius * (w > h ? 1.50f : .92f);
            float y = cy + (float)Math.sin(angle) * radius * .78f;
            int a = 20 + (int)(70f * energy * particleSize[i] / 2.6f);
            if (talking) a += (int)(55f * speechEnergy);
            boolean amber = i % 13 == 0;
            paint.setColor(amber ? Color.argb(Math.min(170, a), 255, 163, 54)
                    : Color.argb(Math.min(180, a), 11, 205, 255));
            float size = .55f + particleSize[i] * (talking ? 1.05f + .55f * speechEnergy : .72f);
            canvas.drawCircle(x, y, size, paint);
        }
    }

    private void drawReadabilityFade(Canvas canvas, float w, float h) {
        paint.setStyle(Paint.Style.FILL);
        paint.setShader(new LinearGradient(0, 0, 0, h,
                new int[]{Color.argb(86, 1, 6, 17), Color.TRANSPARENT, Color.TRANSPARENT,
                        Color.argb(90, 1, 7, 18), Color.argb(246, 1, 7, 18)},
                new float[]{0f, .14f, .60f, .69f, .83f}, Shader.TileMode.CLAMP));
        canvas.drawRect(0, 0, w, h, paint);
        paint.setShader(null);
    }

    private float speechEnvelope(float t) {
        float v = .52f + .22f * (float)Math.sin(t * 8.7f)
                + .16f * (float)Math.sin(t * 13.9f + 1.1f)
                + .10f * (float)Math.sin(t * 21.7f + 2.4f);
        return clamp(v, .18f, 1f);
    }

    private float clamp(float value, float min, float max) {
        return Math.max(min, Math.min(max, value));
    }
}
