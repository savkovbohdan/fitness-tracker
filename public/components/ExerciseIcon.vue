<template>
    <div :class="iconClass" :style="iconStyle">
        <img v-if="photoUrl" :src="photoUrl" alt="Exercise" 
             style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;" />
        <span v-else>💪</span>
    </div>
</template>

<script>
export default {
    name: 'ExerciseIcon',
    props: {
        photoUrl: String,
        size: {
            type: Number,
            default: 48
        }
    },
    computed: {
        iconClass() {
            return this.photoUrl ? 'exercise-icon photo' : 'exercise-icon placeholder';
        },
        iconStyle() {
            return {
                width: this.size + 'px',
                height: this.size + 'px'
            };
        }
    }
}
</script>
