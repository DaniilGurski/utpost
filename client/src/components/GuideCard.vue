<script setup >
import { RouterLink } from 'vue-router';



const props = defineProps({
    guide: {
        type: Object,
        required: true  
    }
})


</script>

<template>
<div>
    <h3><RouterLink :to="`/guider/${props.guide.slug}`">{{ props.guide.title }}</RouterLink></h3>
    <p>{{ props.guide.region }} · {{ props.guide.difficulty }} · {{ props.guide.length_km }} km</p>
<div v-html="props.guide.body_html.slice(0, 180)"></div>
</div>

</template>