<script setup lang="ts">
import { computed } from 'vue'
import { CSS_FONT, layoutText, lineOrigin, type TextContent } from 'pdfrs-editor'

/**
 * Text as the PDF will have it: laid out with the engine's own metrics and
 * drawn as SVG filling its box. Each line is forced to its computed width
 * (textLength), so even if the browser's font differs a little from the
 * PDF standard font, lines start, end and wrap exactly where they will.
 */
const props = defineProps<{ content: TextContent }>()

/** SVG units per em: text at a font size of 1 would be blurry in some browsers. */
const UNIT = 100

const layout = computed(() => layoutText(props.content.text, props.content))
const lines = computed(() =>
  layout.value.lines.map((line, index) => ({
    line,
    width: (layout.value.lineWidths[index] ?? 0) * UNIT,
    ...lineOrigin(layout.value, index, props.content.align),
  })),
)
</script>

<template>
  <svg
    class="block size-full overflow-visible"
    :viewBox="`0 0 ${layout.width * UNIT} ${layout.height * UNIT}`"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <template v-for="(item, index) in lines" :key="index">
      <text
        v-if="item.width > 0"
        :x="item.x * UNIT"
        :y="item.y * UNIT"
        :font-size="UNIT"
        :font-family="CSS_FONT[content.font]"
        :font-weight="content.bold ? 700 : 400"
        :font-style="content.italic ? 'italic' : 'normal'"
        :fill="content.color"
        :textLength="item.width"
        lengthAdjust="spacingAndGlyphs"
        xml:space="preserve"
        v-text="item.line"
      />
    </template>
  </svg>
</template>
