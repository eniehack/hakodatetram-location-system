<script lang="ts">
  type Props = {
    isOpen: boolean
  }
  let { isOpen = $bindable() }: Props = $props();

  function closeModal() {
    isOpen = false;
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }

  function handleConfirm() {
    closeModal();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div 
    class="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4" 
  >
    <div 
      class="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
    >
      <div class="p-6 flex justify-between items-center">
        <h2 class="text-xl font-semibold text-gray-800">函館市電</h2>
      </div>

      <div class="px-6 py-2 flex-1 overflow-y-auto prose">
        <p>このサイトは函館市電を遠くの街からでも眺めたいと思うマニアのためのサイトです。そのため、実際の乗り換え案内などに利用することが想定されていません。</p>
        <p>このサイトは函館市と一切関係がなく、非公認非公式のサイトです。</p>
        <p>実際に市電を利用される場合はイカす度が高めなICAS locationや乗換アプリをご利用ください</p>
      </div>

      <div class="px-6 pb-6 pt-2 flex justify-end gap-3 sm:flex-row flex-col">
        <button 
          type="button"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-medium min-w-[80px]"
          onclick={() => handleConfirm()}
        >
          続行する
        </button>
        <a 
          class="block px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors font-medium min-w-[80px] text-center"
          href="https://icas.hakodatecitytram.com/"
        >
          やめる
          <span class="text-xs">（ICAS locationへ）</span>
        </a>
      </div>
    </div>
  </div>
{/if}