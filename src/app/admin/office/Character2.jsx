"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatedSprite, Container, Graphics, Text } from "@pixi/react";
import { Spritesheet, BaseTexture, SCALE_MODES } from "pixi.js";

export function Character2({
  x,
  y,
  characterName,
  spritesheetData,
  textureUrl,
  isMoving = false,
  facing = 0, // 0=right, 1=down, 2=left, 3=up
  isWorking = false,
  isIdle = false,
  isGod = false,
  name = "",
  onClick,
  conversationState = null, // { state, isSpeaking, isThinking, bubbleText }
}) {
  const [spriteSheet, setSpriteSheet] = useState(null);
  const animRef = useRef(null);
  const [currentAnimation, setCurrentAnimation] = useState("down");

  // Load spritesheet once
  useEffect(() => {
    let mounted = true;
    const parseSheet = async () => {
      try {
        const baseTexture = BaseTexture.from(textureUrl, { scaleMode: SCALE_MODES.NEAREST });
        const sheet = new Spritesheet(baseTexture, spritesheetData);
        await sheet.parse();
        if (mounted) setSpriteSheet(sheet);
      } catch (e) {
        console.error("Spritesheet parse failed:", e);
      }
    };
    parseSheet();
    return () => { mounted = false; };
  }, [textureUrl, spritesheetData]);

  // Map facing to animation name
  useEffect(() => {
    const dirs = ["right", "down", "left", "up"];
    const anim = dirs[facing % 4] || "down";
    setCurrentAnimation(anim);
    if (animRef.current) {
      if (isMoving) {
        animRef.current.textures = spriteSheet?.animations[anim] || [];
        animRef.current.animationSpeed = 0.15;
        animRef.current.play();
      } else {
        animRef.current.stop();
        // Show first frame of direction (idle)
        const frames = spriteSheet?.animations[anim] || [];
        if (frames[0]) animRef.current.texture = frames[0];
      }
    }
  }, [facing, isMoving, spriteSheet]);

  // Sitting pose when working and not moving
  const isSitting = isWorking && !isMoving;
  const showSitAnimation = isSitting && spriteSheet?.animations.sit;

  if (!spriteSheet) return null;

  const directionFrames = spriteSheet.animations[currentAnimation] || [];
  const idleTexture = directionFrames[0];

  // Conversation bubbles
  const isSpeaking = conversationState?.isSpeaking;
  const isThinking = conversationState?.isThinking;
  const bubbleText = conversationState?.bubbleText || "";

  return (
    <Container
      x={x}
      y={y}
      interactive={true}
      cursor="pointer"
      onPointerDown={onClick}
    >
      {/* Shadow */}
      <Graphics
        draw={(g) => g.ellipse(0, 18, 14, 4).fill({ color: 0x000000, alpha: 0.3 })}
      />

      {/* Animated Sprite */}
      <AnimatedSprite
        ref={animRef}
        textures={showSitAnimation ? spriteSheet.animations.sit : directionFrames}
        animationSpeed={isMoving ? 0.15 : 0}
        isPlaying={isMoving || showSitAnimation}
        anchor={{ x: 0.5, y: 0.5 }}
        scale={1.5}
      />

      {/* Speech/Thought bubbles */}
      {isSpeaking && (
        <Container x={18} y={-36}>
          <Graphics
            draw={(g) => g.roundRect(-30, -16, 60, 24, 8).fill({ color: 0xf3f5f8, alpha: 0.95 }).stroke({ width: 1, color: 0xcbd3dd })}
          />
          <Text
            x={0}
            y={-4}
            anchor={{ x: 0.5, y: 0.5 }}
            text="💬"
            style={{ fontSize: 14 }}
          />
        </Container>
      )}
      {isThinking && (
        <Container x={-24} y={-36}>
          <Text
            x={0}
            y={0}
            anchor={{ x: 0.5, y: 0.5 }}
            text="💭"
            style={{ fontSize: 16 }}
          />
        </Container>
      )}

      {/* Conversation bubble text */}
      {bubbleText && (
        <Container x={0} y={-52}>
          <Graphics
            draw={(g) => g.roundRect(-50, -18, 100, 28, 8).fill({ color: 0x111827, alpha: 0.9 }).stroke({ width: 1, color: 0x4ea1ff })}
          />
          <Text
            x={0}
            y={-4}
            anchor={{ x: 0.5, y: 0.5 }}
            text={bubbleText}
            style={{ fill: 0xf3f5f8, fontSize: 9, fontWeight: "600", wordWrap: true, wordWrapWidth: 90 }}
          />
        </Container>
      )}

      {/* Name tag */}
      <Text
        x={0}
        y={-40}
        anchor={{ x: 0.5, y: 0.5 }}
        text={name}
        style={{
          fill: 0xdfe6ef,
          fontSize: 10,
          fontWeight: "700",
          fontFamily: "Inter, system-ui, sans-serif",
          stroke: { color: 0x000000, width: 2 },
        }}
      />

      {/* God crown */}
      {isGod && (
        <Graphics
          draw={(g) => g.roundRect(-10, -50, 20, 6, 2).fill(0xf4d35e)}
        />
      )}
    </Container>
  );
}

export default Character2;