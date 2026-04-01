import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          background: "linear-gradient(145deg, #1a8a8c 0%, #006668 60%, #004d4f 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 태양 */}
        <div
          style={{
            position: "absolute",
            top: 7,
            left: 8,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#52f2f5",
            boxShadow: "0 0 4px #a8fafa",
            display: "flex",
          }}
        />
        {/* 구름 */}
        <div
          style={{
            position: "absolute",
            bottom: 7,
            left: 5,
            right: 5,
            height: 10,
            borderRadius: 6,
            background: "white",
            opacity: 0.92,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 13,
            left: 10,
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: "white",
            opacity: 0.92,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 11,
            left: 16,
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "white",
            opacity: 0.92,
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
