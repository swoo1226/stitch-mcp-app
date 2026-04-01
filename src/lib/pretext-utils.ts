import { prepareWithSegments, layoutWithLines } from "@chenglou/pretext";
import { useMemo } from "react";

/**
 * 전역 캔버스 컨텍스트 (브라우저 환경용)
 */
let canvas: HTMLCanvasElement | null = null;
function getCanvasContext() {
  if (typeof window === "undefined") return null;
  if (!canvas) {
    canvas = document.createElement("canvas");
  }
  return canvas.getContext("2d");
}

interface TextLayoutParams {
  text: string;
  fontSize: number;
  fontFamily: string;
  maxWidth: number;
  lineHeight?: number;
}

/**
 * Pretext를 사용하여 텍스트 레이아웃을 고성능으로 계산하는 훅입니다.
 * 브라우저 레이아웃 엔진을 거치지 않으므로 리플로우가 발생하지 않습니다.
 */
export function useTextLayout({
  text,
  fontSize,
  fontFamily,
  maxWidth,
  lineHeight = 1.5
}: TextLayoutParams) {
  return useMemo(() => {
    // 폰트 문자열 구성 (Canvas context가 아닌 문자열이 필요함)
    const font = `${fontSize}px ${fontFamily}`;
    
    if (!text) return { width: 0, height: 0, lineCount: 0, lines: [] };

    // 1. Prepare: 텍스트 전처리 (세그먼트 포함 버전 사용)
    // layoutWithLines를 사용하려면 prepareWithSegments가 필요합니다.
    const prepared = prepareWithSegments(text, font, { whiteSpace: 'pre-wrap' });

    // 2. Layout with Lines: 각 라인의 너비 정보를 포함하여 레이아웃 계산
    // layoutWithLines(prepared, maxWidth, lineHeightInPx)
    const lineHeightPx = fontSize * lineHeight;
    const result = layoutWithLines(prepared as any, maxWidth, lineHeightPx);

    // 각 라인 중 가장 넓은 너비를 최종 너비로 사용 (Shrink-wrap)
    const finalWidth = result.lines.reduce((max: number, line: any) => Math.max(max, line.width), 0);

    return {
      width: finalWidth,
      height: result.height,
      lineCount: result.lineCount,
      lines: result.lines
    };
  }, [text, fontSize, fontFamily, maxWidth, lineHeight]);
}
