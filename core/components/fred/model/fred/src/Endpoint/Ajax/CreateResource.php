<?php
/*
 * This file is part of the Fred package.
 *
 * Copyright (c) MODX, LLC
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Fred\Endpoint\Ajax;


class CreateResource extends Endpoint
{
    function process()
    {
        if (!isset($this->body['parent'])) {
            return $this->failure('No id was provided');
        }

        if (!isset($this->body['template'])) {
            return $this->failure('No template was provided');
        }
        
        if (empty($this->body['pagetitle'])) {
            return $this->failure('No pagetitle was provided', ['pagetitle' => 'No pagetitle was provided']);
        }

        $context = 'web';

        $c = $this->modx->newQuery('modResource');
        $c->where([
            'context_key' => $context,
            'parent' => $this->body['parent']
        ]);
        $c->sortby('menuindex', 'DESC');
        $c->limit(1);
        $lastResource = $this->modx->getObject('modResource', $c);
        $menuindex = $lastResource ? ($lastResource->menuindex + 1) : 0;
        
        $props = [
            'context_key' => $context,
            'parent' => $this->body['parent'],
            'template' => $this->body['template'],
            'pagetitle' => $this->body['pagetitle'],
            'richtext' => 0,
            'menuindex' => $menuindex
        ];
        
        $response = $this->modx->runProcessor('resource/create', $props);
        
        if ($response->isError()) {
            return $this->failure('Error creating new resource');
        }
        
        $object = $response->getObject();
        
         $data = [
            'message' => 'Resource created',
            'url' => $this->modx->makeUrl($object['id'], $context, '', 'full')
        ];

        return $this->success($data);
    }
}
