import fs from 'node:fs';
import path from 'node:path';

const MASCOT_DIR = path.join('src', 'components', 'mascot');

const FILES = [
  ['happy.svg', 'HappyPose.tsx', 'HappyPose'],
  ['think.svg', 'ThinkingPose.tsx', 'ThinkingPose'],
  ['sleepy.svg', 'SleepyPose.tsx', 'SleepyPose'],
  ['cheer.svg', 'CheeringPose.tsx', 'CheeringPose'],
  ['logo.svg', 'KakuLogo.tsx', 'KakuLogo'],

];

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function convertSvgToJsx(rawSvg) {
  const openTagMatch = rawSvg.match(/<svg[^>]*>/i);
  const openTag = openTagMatch ? openTagMatch[0] : '';
  const viewBoxMatch = openTag.match(/viewBox=["']([^"']+)["']/i);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 500 500';

  let inner = rawSvg
    .replace(/^[\s\S]*?<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(sodipodi|inkscape|rdf|cc|dc|metadata)[^>]*>[\s\S]*?<\/\1[^>]*>/gi, '')
    .replace(/<(sodipodi|inkscape|rdf|cc|dc|metadata)[^>]*\/>/gi, '')
    .replace(/\s+(xmlns:[a-z0-9_-]+|xml:[a-z0-9_-]+|inkscape:[a-z0-9_-]+|sodipodi:[a-z0-9_-]+)=["'][^"']*["']/gi, '');

  // Convert inline style="..." strings into React style={{ ... }} objects
  inner = inner.replace(/\sstyle=["']([^"']*)["']/gi, (_, styleBody) => {
    const entries = styleBody
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((pair) => {
        const colonIdx = pair.indexOf(':');
        if (colonIdx === -1) return null;
        const prop = toCamelCase(pair.slice(0, colonIdx).trim());
        const val = pair.slice(colonIdx + 1).trim().replace(/'/g, "\\'");
        return `${prop}: '${val}'`;
      })
      .filter(Boolean);

    return entries.length > 0 ? ` style={{ ${entries.join(', ')} }}` : '';
  });

  // Convert class and hyphenated SVG attributes to React JSX camelCase
  inner = inner.replace(/\sclass=/gi, ' className=');
  inner = inner.replace(/\s([a-z]+-[a-z-]+)=/gi, (_, attr) => {
    if (attr.startsWith('data-') || attr.startsWith('aria-')) {
      return ` ${attr}=`;
    }
    return ` ${toCamelCase(attr)}=`;
  });

  return { viewBox, inner: inner.trim() };
}

for (const [svgFilename, tsxFilename, componentName] of FILES) {
  const svgPath = path.join(MASCOT_DIR, svgFilename);
  if (!fs.existsSync(svgPath)) {
    console.error(`Missing file: ${svgPath}`);
    continue;
  }

  const rawSvg = fs.readFileSync(svgPath, 'utf8');
  const { viewBox, inner } = convertSvgToJsx(rawSvg);

  const tsxContent = `export interface MascotPoseProps {
  className?: string;
}

export function ${componentName}({ className }: MascotPoseProps) {
  return (
    <svg
      viewBox="${viewBox}"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
${inner}
    </svg>
  );
}
`;

  fs.writeFileSync(path.join(MASCOT_DIR, tsxFilename), tsxContent, 'utf8');
  console.log(`Created ${path.join(MASCOT_DIR, tsxFilename)}`);
}