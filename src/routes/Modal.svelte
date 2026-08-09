<script lang="ts">
	type Props = {
		isOpen: boolean;
	};
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
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center p-4">
		<div
			class="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-lg bg-white shadow-xl"
		>
			<div class="flex items-center justify-between p-6">
				<h2 class="text-xl font-semibold text-gray-800">函館市電</h2>
			</div>

			<div class="prose flex-1 overflow-y-auto px-6 py-2">
				<p>
					このサイトは函館市電を遠くの街からでも眺めたいと思うマニアのためのサイトです。そのため、実際の乗り換え案内などに利用することが想定されていません。
				</p>
				<p>このサイトは函館市と一切関係がなく、非公認非公式のサイトです。</p>
				<p>実際に市電を利用される場合はイカす度が高めなICAS locationや乗換アプリをご利用ください</p>
			</div>

			<div class="flex flex-col justify-end gap-3 px-6 pt-2 pb-6 sm:flex-row">
				<button
					type="button"
					class="min-w-[80px] rounded bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600"
					onclick={() => handleConfirm()}
				>
					続行する
				</button>
				<a
					class="block min-w-[80px] rounded bg-gray-500 px-4 py-2 text-center font-medium text-white transition-colors hover:bg-gray-600"
					href="https://icas.hakodatecitytram.com/location/index.htm"
				>
					やめる
					<span class="text-xs">（ICAS locationへ）</span>
				</a>
			</div>
		</div>
	</div>
{/if}
